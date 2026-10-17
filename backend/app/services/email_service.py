import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
except ImportError:
    pass

def get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

def get_backend_url() -> str:
    return os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")

def _send_smtp_email(to_email: str, subject: str, html_body: str, plain_body: str) -> dict:
    """
    Sends email via Resend API (HTTPS port 443), Brevo API (HTTPS port 443),
    or standard SMTP (port 587).
    HTTPS APIs are recommended on cloud hosts like Render Free Tier which block outbound SMTP ports.
    Falls back gracefully to development console simulation if neither is configured.
    """
    import httpx

    # 1. OPTION A: RESEND HTTPS API (Port 443 - Recommended for Render/Vercel)
    resend_api_key = os.getenv("RESEND_API_KEY", "").strip()
    if resend_api_key:
        resend_from = os.getenv("RESEND_FROM", "NourishSync <onboarding@resend.dev>").strip()
        try:
            resp = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": resend_from,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                    "text": plain_body
                },
                timeout=12.0
            )
            if resp.status_code in (200, 201):
                print(f"[EMAIL SERVICE] Transmitted '{subject}' to {to_email} via Resend HTTPS API (Port 443).")
                return {"sent": True, "simulated": False, "provider": "resend"}
            else:
                print(f"[EMAIL SERVICE WARNING] Resend API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[EMAIL SERVICE WARNING] Resend API request failed: {e}")

    # 2. OPTION B: BREVO HTTPS API (Port 443)
    brevo_api_key = os.getenv("BREVO_API_KEY", "").strip()
    if brevo_api_key:
        from_email = os.getenv("EMAIL_FROM", os.getenv("SMTP_USERNAME", "nourishsync@gmail.com")).strip()
        try:
            resp = httpx.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": brevo_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "sender": {"name": "NourishSync", "email": from_email},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html_body,
                    "textContent": plain_body
                },
                timeout=12.0
            )
            if resp.status_code in (200, 201):
                print(f"[EMAIL SERVICE] Transmitted '{subject}' to {to_email} via Brevo HTTPS API (Port 443).")
                return {"sent": True, "simulated": False, "provider": "brevo"}
            else:
                print(f"[EMAIL SERVICE WARNING] Brevo API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[EMAIL SERVICE WARNING] Brevo API request failed: {e}")

    # 3. OPTION C: STANDARD SMTP (Port 587 - Gmail / Outlook)
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", os.getenv("SMTP_USER", "")).strip()
    password = os.getenv("SMTP_APP_PASSWORD", os.getenv("SMTP_PASSWORD", "")).strip()
    from_email = os.getenv("EMAIL_FROM", os.getenv("EMAILS_FROM", username or "nourishsync@gmail.com")).strip()

    if host and username and password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_email
            msg["To"] = to_email

            msg.attach(MIMEText(plain_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(host, port, timeout=12) as server:
                server.starttls()
                server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())

            print(f"[EMAIL SERVICE] Transmitted '{subject}' to {to_email} via SMTP ({host}:{port}).")
            return {"sent": True, "simulated": False, "provider": "smtp"}
        except Exception as e:
            print(f"[EMAIL SERVICE WARNING] SMTP transmission failed ({e}).")
            print("[EMAIL SERVICE TIP] Render Free Tier blocks outbound SMTP ports 587/465. Use RESEND_API_KEY in Render Environment Variables for HTTPS delivery.")

    # 4. DEVELOPMENT SIMULATION FALLBACK
    print("\n" + "=" * 72)
    print("      NOURISHSYNC EMAIL DISPATCH (DEV MODE / SIMULATED - NOT SENT)      ")
    print("=" * 72)
    print(f"To      : {to_email}")
    print(f"From    : {from_email or 'nourishsync@gmail.com'}")
    print(f"Subject : {subject}")
    print("Status  : REAL EMAIL WAS NOT SENT (No valid SMTP/API key configured on this host)")
    print("-" * 72)
    print(plain_body)
    print("=" * 72 + "\n")
    return {"sent": True, "simulated": True, "provider": "dev_simulation"}

def _wrap_html(title: str, content_html: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
    .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .logo {{ text-align: center; margin-bottom: 24px; }}
    .badge {{ display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }}
    h1 {{ color: #0f172a; font-size: 20px; font-weight: 800; margin: 12px 0 16px 0; }}
    p {{ color: #334155; font-size: 14px; line-height: 1.6; margin: 12px 0; }}
    .btn-wrap {{ text-align: center; margin: 28px 0; }}
    .btn {{ background-color: #059669; color: #ffffff !important; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; }}
    .notice {{ background: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569; margin: 20px 0; }}
    .warning {{ background: #fffbeb; border-left: 4px solid #d97706; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 20px 0; }}
    .footer {{ margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }}
    .link-alt {{ word-break: break-all; color: #2563eb; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div style="font-size: 32px;">🌿</div>
      <div class="badge">NourishSync Platform</div>
    </div>
    <h1>{title}</h1>
    {content_html}
    <div class="footer">
      NourishSync — AI-Driven Food Surplus Prediction and Smart Redistribution System<br>
      © 2026 NourishSync Team. All rights reserved.
    </div>
  </div>
</body>
</html>"""

def send_email_a_verification(email: str, token: str, contact_name: str = "Applicant", frontend_url: str = None) -> dict:
    """
    Email A: Verify your email address — NourishSync
    Sent immediately upon registration.
    """
    active_frontend = (frontend_url or get_frontend_url()).rstrip("/")
    verification_url = f"{active_frontend}/verify-email?token={token}"
    subject = "Verify your email address — NourishSync"

    plain_body = f"""Hello {contact_name},

Thank you for registering your organization with NourishSync.

Please verify your email address by clicking the link below:
{verification_url}

After email verification, your organization will undergo a manual review before access is granted.
Verifying your email does not automatically approve your organization.

If you did not submit this application, you can ignore this message.

Regards,
NourishSync Team"""

    content_html = f"""<p>Hello <strong>{contact_name}</strong>,</p>
<p>Thank you for registering your organization with NourishSync.</p>
<p>Please verify your email address by clicking the button below:</p>
<div class="btn-wrap">
  <a href="{verification_url}" class="btn" target="_blank">Verify Email Address</a>
</div>
<div class="warning">
  <strong>Important:</strong> After email verification, your organization will undergo a manual review before access is granted.
  <strong>Verifying your email does not automatically approve your organization.</strong>
</div>
<p>Or paste this link into your browser:</p>
<p class="link-alt">{verification_url}</p>
<p>This verification link will expire in 24 hours.</p>
<p>If you did not submit this application, you can ignore this message.</p>
<p>Regards,<br><strong>NourishSync Team</strong></p>"""

    res = _send_smtp_email(email, subject, _wrap_html("Verify your email address", content_html), plain_body)
    res["verification_url"] = verification_url
    return res

def send_email_b_approval_pending(email: str, contact_name: str = "Applicant") -> dict:
    """
    Email B: Email verified — NourishSync approval pending
    Sent when the user clicks the verification link.
    """
    subject = "Email verified — NourishSync approval pending"

    plain_body = f"""Hello {contact_name},

Your email address has been verified successfully.

Your organization is now awaiting review by the NourishSync administration team. We will examine the submitted details and supporting documents and may contact you for additional information.

You cannot use the operational application until your organization is approved.
We will email you when a decision has been made.

Regards,
NourishSync Team"""

    content_html = f"""<p>Hello <strong>{contact_name}</strong>,</p>
<p>Your email address has been verified successfully.</p>
<div class="notice">
  <strong>Status: Awaiting Manual Review</strong><br>
  Your organization is now awaiting review by the NourishSync administration team. We will examine the submitted details and supporting documents and may contact you for additional information.
</div>
<p><strong>You cannot use the operational application until your organization is approved.</strong></p>
<p>We will email you when a decision has been made.</p>
<p>Regards,<br><strong>NourishSync Team</strong></p>"""

    return _send_smtp_email(email, subject, _wrap_html("Email Verified — Approval Pending", content_html), plain_body)

def send_email_c_organization_approved(email: str, contact_name: str, role: str) -> dict:
    """
    Email C: Your NourishSync organization account has been approved
    Sent when admin clicks Approve.
    """
    portal_label = "Food Donor" if role == "donor" else "Food Acceptor"
    login_url = f"{get_frontend_url()}/login"
    subject = "Your NourishSync organization account has been approved"

    plain_body = f"""Hello {contact_name},

Good news! Your organization has been approved to use NourishSync.

You can now sign in using your registered email address and access the appropriate {portal_label} dashboard:
{login_url}

Thank you for helping make surplus food available to organizations that need it.

Regards,
NourishSync Team"""

    content_html = f"""<p>Hello <strong>{contact_name}</strong>,</p>
<div class="notice" style="border-left-color: #059669; background: #ecfdf5; color: #065f46;">
  <strong>Good news!</strong> Your organization has been approved to use NourishSync.
</div>
<p>You can now sign in using your registered email address and access the appropriate <strong>{portal_label}</strong> dashboard.</p>
<div class="btn-wrap">
  <a href="{login_url}" class="btn" target="_blank">Sign In to {portal_label} Portal</a>
</div>
<p>Thank you for helping make surplus food available to organizations that need it.</p>
<p>Regards,<br><strong>NourishSync Team</strong></p>"""

    return _send_smtp_email(email, subject, _wrap_html("Organization Account Approved", content_html), plain_body)

def send_email_d_organization_rejected(email: str, contact_name: str, reason: str) -> dict:
    """
    Email D: Update regarding your NourishSync application
    Sent when admin clicks Reject with a reason.
    """
    subject = "Update regarding your NourishSync application"

    plain_body = f"""Hello {contact_name},

Thank you for applying to NourishSync.

After reviewing your application, we are unable to approve it at this time.

Reason:
{reason}

This application is now closed. If you wish to apply again, you must submit a new application with the required information and supporting evidence.
A new application will undergo the verification process again.

Regards,
NourishSync Team"""

    content_html = f"""<p>Hello <strong>{contact_name}</strong>,</p>
<p>Thank you for applying to NourishSync.</p>
<p>After reviewing your application, we are unable to approve it at this time.</p>
<div class="warning">
  <strong>Decision Reason:</strong><br>
  {reason}
</div>
<p>This application is now closed. If you wish to apply again, you must submit a new application with the required information and supporting evidence.</p>
<p>A new application will undergo the verification process again.</p>
<p>Regards,<br><strong>NourishSync Team</strong></p>"""

    return _send_smtp_email(email, subject, _wrap_html("Application Update", content_html), plain_body)

# Legacy alias for backward compatibility
def send_verification_email(email: str, token: str, user_name: str = "User") -> dict:
    return send_email_a_verification(email, token, user_name)
