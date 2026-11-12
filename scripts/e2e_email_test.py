import re, subprocess, time, sys
from playwright.sync_api import sync_playwright
B = "http://localhost:3000"
DB = "postgres://ain:ain@localhost/ain"
def sql(q): return subprocess.run(["psql", DB, "-tAc", q], capture_output=True, text=True).stdout.strip()
def log(): return open("/tmp/next.log").read()
def last_link(path):
    m = re.findall(re.escape("http://localhost:3000" + path) + r"\?token=([\w-]+)", log())
    return m[-1] if m else None
fails = []
def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name); 
    if not cond: fails.append(name)

email = f"new{int(time.time())}@test.local"
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page()
    # signup -> unverified banner
    pg.goto(B + "/signup?role=builder")
    pg.fill("#f-name", "Ada Builder"); pg.fill("#f-email", email); pg.fill("#f-password", "Password12345")
    pg.check("input[name=terms]"); pg.click("button[type=submit]"); pg.wait_for_url("**/dashboard/passport**")
    check("unverified banner shows", pg.locator(".verify-banner").count() == 1)
    time.sleep(1)
    tok = last_link("/verify-email")
    check("verification email logged", tok is not None)
    # gated: apply to a brief
    bid = sql("select id from briefs where status='OPEN' and not is_sample limit 1")
    pg.goto(B + f"/briefs/{bid}")
    if pg.locator("textarea[name=pitch]").count():
        pg.fill("textarea[name=pitch]", "I have built retrieval systems for three hackathons and would love this."); pg.click("form:has(textarea[name=pitch]) button[type=submit]")
        pg.wait_for_selector(".notice.err"); check("unverified cannot apply", "confirm your email" in pg.inner_text(".notice.err").lower())
    else: check("pitch form present", False)
    # resend rate limit works
    pg.goto(B + "/dashboard"); pg.click(".verify-banner button"); pg.wait_for_selector(".verify-banner .notice")
    check("resend link ok", "sent a new link" in pg.inner_text(".verify-banner .notice"))
    tok = last_link("/verify-email")
    pg.goto(B + f"/verify-email?token={tok}"); 
    check("verify lands on dashboard", "verified=1" in pg.url and pg.locator(".verify-banner").count() == 0)
    pg.goto(B + f"/verify-email?token={tok}"); check("reused token rejected", "verify=expired" in pg.url)
    check("db verified", sql(f"select email_verified_at is not null from users where email='{email}'") == "t")
    pg.goto(B + f"/briefs/{bid}")
    pg.fill("textarea[name=pitch]", "I have built retrieval systems for three hackathons and would love this."); pg.click("form:has(textarea[name=pitch]) button[type=submit]")
    pg.wait_for_selector("text=You’ve expressed interest"); check("verified can apply", True)
    time.sleep(1); check("org notified of interest", "New interest in" in log())
    # passport shows upload placeholder (no blob token)
    pg.goto(B + "/dashboard/passport"); pg.fill("#f-title","Demo app"); pg.fill("#f-context","A context long enough to pass the check."); pg.fill("#f-contribution","My contribution was long enough too, really.")
    pg.click("form:has(#f-title) button[type=submit]"); pg.wait_for_selector("text=File attachments are coming soon")
    check("upload placeholder without blob token", True)

    # forgot / reset
    ctx2 = br.new_context(); p2 = ctx2.new_page()
    p2.goto(B + "/login"); check("forgot link on login", p2.locator("a[href='/forgot-password']").count() == 1)
    p2.goto(B + "/forgot-password"); p2.fill("#f-email", "nobody@nowhere.test"); p2.click("button[type=submit]"); p2.wait_for_selector(".notice.ok")
    check("unknown email same message", "If an account exists" in p2.inner_text(".notice.ok"))
    p2.goto(B + "/forgot-password"); p2.fill("#f-email", email); p2.click("button[type=submit]"); p2.wait_for_selector(".notice.ok"); time.sleep(1)
    rt = last_link("/reset-password"); check("reset email logged", rt is not None)
    p2.goto(B + "/reset-password?token=bogus-token-value"); check("bad reset token shows error", p2.locator(".notice.err").count() == 1)
    p2.goto(B + f"/reset-password?token={rt}"); p2.fill("#f-password","NewPassword999"); p2.fill("#f-confirm","Mismatch999x"); p2.click("button[type=submit]"); p2.wait_for_selector(".notice.err")
    check("mismatch rejected", "match" in p2.inner_text(".notice.err"))
    p2.fill("#f-password","NewPassword999"); p2.fill("#f-confirm","NewPassword999"); p2.click("button[type=submit]"); p2.wait_for_url("**/dashboard?reset=1")
    check("reset signs in", True)
    pg.goto(B + "/dashboard"); check("old session signed out", "/login" in pg.url)
    p2.goto(B + f"/reset-password?token={rt}"); check("reset token single use", p2.locator(".notice.err").count() == 1)
    time.sleep(1); check("password changed email", "Your AI Nation password was changed" in log())

    # org shortlists -> builder notified
    o = br.new_context().new_page(); o.goto(B + "/login"); o.fill("#f-email","org@demo.aination"); o.fill("#f-password","DemoPass2026"); o.click("button[type=submit]"); o.wait_for_url("**/dashboard**")
    o.goto(B + f"/dashboard/briefs/{bid}")
    btn = o.locator("button:has-text('Shortlist')").first
    if btn.count(): btn.click(); time.sleep(2); check("builder notified on shortlist", "You’ve been shortlisted" in log())
    else: check("shortlist button present", False)
    # evidence route access control
    a = br.new_context().new_page(); r = a.request.get(B + "/api/evidence/whatever"); check("evidence needs sign-in", r.status == 401)
    r = a.request.post(B + "/api/evidence/upload", data="{}"); check("upload disabled without token", r.status == 503)
    br.close()
print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
