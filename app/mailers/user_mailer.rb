class UserMailer < ApplicationMailer

  include ApplicationHelper

  default from: 'no-reply@customerstories.net'

  TEST_EMAILS = ['***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***']

  def request_contribution contribution
    # don't track emails sent from dev or staging ...
    headers['X-SMTPAPI'] = { unique_args: {
                                contribution_id: contribution.id
                             }}.to_json if production?
    @body = contribution.email_contribution_request.body.html_safe
    send_mail contribution.success.curator, contribution.contributor,
              contribution.email_contribution_request.subject
  end

  def send_contribution_reminder contribution
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
    send_mail curator, contributor, subject, true
  end

  def alert_contribution_update contribution
    success = contribution.success
    story = success.story
    company = success.customer.company
    customer_name = success.customer.name
    # http - so it works in development
    story_link = "http://#{company.subdomain}.#{ENV['HOST_NAME']}/stories/#{story.id}/edit"
    curator = success.curator
    contributor = contribution.contributor
    if contribution.status == 'contribution'
      subject = "#{contributor.full_name} of the
        #{customer_name} success story submitted a contribution"
      @body = "<p>#{curator.first_name},</p>
        <p>#{contributor.full_name} of the story \"#{story.title}\"
           submitted a contribution:</p>
        <p><i>\"#{contribution.contribution}\"</i></p>
        <p><a href='#{story_link}'>Go to story</a></p>".html_safe
    elsif contribution.status == 'feedback'
      subject = "#{contributor.full_name} of the
        #{customer_name} success story submitted feedback"
      @body = "<p>#{curator.first_name},</p>
        <p>#{contributor.full_name} of the story \"#{story.title}\"
           submitted feedback:</p>
        <p><i>\"#{contribution.feedback}\"</i></p>
        <p><a href='#{story_link}'>Go to story</a></p>".html_safe
    end
    mail to: "#{curator.full_name} <#{curator.email}>",
         from: "Customer Stories Alerts <no-reply@customerstories.net>",
         subject: subject
  end

  def test_template template, curator
    @footer_img_url = CS_POWERED_LOGO_URL
    subject = template.subject
                .sub("[customer_name]", "CustomerCompany")
                .sub("[company_name]", curator.company.name)
    @body = template.body
              .gsub("[customer_name]", "CustomerCompany")
              .gsub("[company_name]", curator.company.name)
              .gsub("[product_name]", "CompanyProduct")
              .gsub("[contributor_first_name]", "Contributor")
              .gsub("[curator_first_name]", curator.first_name)
              .gsub("[referral_intro]", "John Doe referred me to you. ")
              .gsub("[contribution_url]", "#")
              .gsub("[feedback_url]", "#")
              .gsub("[curator_full_name]", curator.full_name)
              .gsub("[curator_email]", curator.email)
              .gsub("[curator_phone]", curator.phone || "")
              .gsub("[curator_title]", curator.title || "")
              .gsub("[unsubscribe_url]", "#")
              .gsub("[opt_out_url]", "#")
              .gsub("[curator_img_url]", curator.photo_url || "")
              .html_safe

    mail       to: "#{curator.full_name} <#{curator.email}>",
              # use default from to avoid same address causing email to bounce
          subject: subject,
    template_path: 'user_mailer',
    template_name: 'request_contribution'

  end

  def send_mail curator, contributor, subject, is_reminder=false
    if Rails.env == 'development'
      if TEST_EMAILS.include? contributor.email
        sender_email = (contributor.email == curator.email ? "dev-test@customerstories.net" : curator.email)
        recipient = "#{contributor.full_name} <#{contributor.email}>"
        sender = "#{curator.full_name} <#{sender_email}>"
      else
        recipient = "#{contributor.full_name} <***REMOVED***>"
        sender = "#{curator.full_name} <#{curator.email}>"
      end
    elsif ENV['HOST_NAME'] == 'customerstories.org'  # staging
      recipient = "***REMOVED***"
      sender = "#{curator.full_name} <#{curator.email}>"
    elsif contributor.email == curator.email
      recipient = "#{contributor.full_name} <#{contributor.email}>"
      sender = 'Customer Stories <no-reply@customerstories.net>'
    else
      recipient = "#{contributor.full_name} <#{contributor.email}>"
      sender = "#{curator.full_name} <#{curator.email}>"
    end
    if is_reminder
      mail to: recipient, from: sender, subject: subject,
      template_path: 'user_mailer', template_name: 'request_contribution'
    else
      mail to: recipient, from: sender, subject: subject
    end
  end

end

