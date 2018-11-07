class UserMailer < ApplicationMailer

  include ApplicationHelper

  default from: 'no-reply@customerstories.net'

  CSP_EMAILS = ['***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***']

  def win_story
    send_mail('win_story')
  end

  def contribution_invitation (contribution)
    # don't track emails sent from dev or staging ...
    headers['X-SMTPAPI'] = {
      unique_args: {
        contribution_id: contribution.id
      }
    }.to_json if production?
    @body = contribution.request_body
    @contribution = contribution
    send_mail('contribution_invitation', contribution.curator, contribution.contributor, contribution.request_subject)
  end

  def contribution_reminder (contribution)
    headers['X-SMTPAPI'] = {
      unique_args: {
        contribution_id: contribution.id
      }
    }.to_json if production?
    if contribution.status == 'request_sent'
      subject = "Reminder: " + contribution.request_subject # don't chain .prepend here; it will persist the data
    else
      subject = "Final reminder: " + contribution.request_subject
    end
    @body = contribution.request_body
    send_mail('remind', contribution.curator, contribution.contributor, subject)
  end

  def contribution_alert (contribution)
    link = contribution.story.present? ? contribution.story.csp_story_url :
      Rails.application.routes.url_helpers.company_main_url('prospect')
    subject = "#{contribution.contributor.full_name} submitted #{contribution.status == 'contribution_submitted' ? 'a contribution' : 'feedback'}"
    @body = "<p>#{contribution.curator.first_name},</p>" +
      "<p>#{contribution.contributor.full_name} of the #{contribution.story.present? ? 'Customer Story' : 'Customer Win' } <a href='#{link}'>#{contribution.story.try(:title) || contribution.success.name}</a> submitted #{contribution.status == 'contribution_submitted' ? 'a contribution' : 'feedback'}:</p>"
    if (contribution.answers.present?)
      @body.concat('<ul>')
      contribution.answers.each do |answer|
        @body.concat(
          "<li style='margin-bottom: 5px'>" +
            "<p style='margin: 0 2px;'>#{answer.question.question}</p>" +
            "<p style='margin: 0 2px; font-style: italic'>#{answer.answer}</p>" +
          "</li>"
        )
      end
      @body.concat('</ul>')
    elsif contribution.contribution.present?
      @body.concat("<p>#{contribution.contribution}</p>")
    else
      @body.concat("<p>#{contribution.feedback}</p>")
    end
    send_mail('alert', contribution.curator, contribution.curator, subject)
  end

  # type is one of: request, remind, alert, test
  def send_mail (type, sender, recipient, subject)
    if Rails.env.development?
      recipient_address = "#{recipient.full_name} <***REMOVED***>"
      sender_address = "#{sender.full_name} <dev-test@customerstories.net>"
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

