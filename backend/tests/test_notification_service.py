from unittest.mock import patch

from app.services.notification_service import NotificationService


def test_motivation_notification_sends_email_for_staff_intervention(app, test_student):
    """Medium-priority motivation emails must not be silently skipped."""
    app.config.update(
        MAIL_USERNAME='mailer@example.com',
        MAIL_DEFAULT_SENDER='mailer@example.com',
    )

    with app.app_context(), patch('app.services.notification_service.mail.send') as send_mail:
        result = NotificationService.send_engagement_notification(
            test_student['id'], 'motivation'
        )

    assert result['success'] is True
    assert send_mail.call_count == 1
    message = send_mail.call_args.args[0]
    assert message.recipients == [test_student['email']]
    assert any(channel['channel'] == 'email' and channel['status'] == 'sent'
               for channel in result['channels'])


def test_notification_reports_email_configuration_failure(app, test_student):
    """The API must not claim success when an email is skipped."""
    app.config['MAIL_USERNAME'] = None

    with app.app_context():
        result = NotificationService.send_engagement_notification(
            test_student['id'], 'motivation'
        )

    assert result['success'] is False
    assert result['error'] == 'Email not configured'
