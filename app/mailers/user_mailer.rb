class UserMailer < ApplicationMailer

  include ApplicationHelper

  default from: 'no-reply@customerstories.net'

  CSP_EMAILS = ['***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***']

  def contribution_request (contribution)
    # don't track emails sent from dev or staging ...
    headers['X-SMTPAPI'] = {
      unique_args: {
        contribution_id: contribution.id
      }
    }.to_json if production?
    @body = contribution.request_body.html_safe
    send_mail('contribution_request', contribution.curator, contribution.contributor, contribution.request_subject)
  end

  def send_contribution_reminder (contribution)
    # TODO: modify seeds so this check isn't necessary ...
    # (a seeded user may have status 'request' with no email_contribution_request)
    return false if contribution.email_contribution_request.nil?
    headers['X-SMTPAPI'] = { unique_args: {
                                contribution_id: contribution.id
                             }}.to_json if production?
    curator = contribution.success.curator
    contributor = contribution.contributor
    if contribution.status == 'request'
      subject = contribution.email_contribution_request.subject.prepend("Reminder: ")
    else
      subject = contribution.email_contribution_request.subject.prepend("Final reminder: ")
    end
    @body = contribution.email_contribution_request.body.html_safe
    send_mail 'remind', curator, contributor, subject
  end

  def contribution_alert (contribution)
    story_link = contribution.story.published? ? contribution.story.csp_story_url :
      Rails.application.routes.url_helpers.curate_story_url(
        contribution.customer.slug, contribution.story.slug
      )
    subject = "#{contribution.contributor.full_name} of the #{contribution.customer.name} success story submitted #{contribution.status == 'contribution_submitted' ? 'a contribution' : 'feedback'}"
    @body = "<p>#{contribution.curator.first_name},</p>
      <p style='margin-bottom:25px'>#{contribution.contributor.full_name} of the story <a href='#{story_link}'>#{contribution.story.title}</a> submitted a contribution:</p>
      #{contribution.contribution}".html_safe
    send_mail('alert', contribution.curator, contribution.curator, subject)
  end

  # type is one of: request, remind, alert, test
  def send_mail (type, sender, recipient, subject)
    if Rails.env == 'development'
      if CSP_EMAILS.include? recipient.email
        # if sender and recipient are same, provide a fake sender address
        sender_email = (recipient.email == sender.email ? "dev-test@customerstories.net" : sender.email)
        recipient_address = "#{recipient.full_name} <#{recipient.email}>"
        sender_address = "#{sender.full_name} <#{sender_email}>"
      else
        recipient_address = "#{recipient.full_name} <***REMOVED***>"
        sender_address = "#{sender.full_name} <#{sender.email}>"
      end
    elsif ENV['HOST_NAME'] == 'customerstories.org'  # staging
      recipient_address = "#{recipient.full_name} <***REMOVED***>"
      sender_address = "#{sender.full_name} <#{sender.email}>"
    elsif recipient.email == sender.email
      recipient_address = "#{recipient.full_name} <#{recipient.email}>"
      sender_address = 'Customer Stories <no-reply@customerstories.net>'
    else
      recipient_address = "#{recipient.full_name} <#{recipient.email}>"
      sender_address = "#{sender.full_name} <#{sender.email}>"
    end

    if type == 'alert'
      sender_address = "Customer Stories Alerts <no-reply@customerstories.net>"
    end

    mail to: recipient_address, from: sender_address, subject: subject,
         template_path: 'user_mailer', template_name: 'standard_template'

  end

end

