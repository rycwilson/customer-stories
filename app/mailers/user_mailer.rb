class UserMailer < ApplicationMailer

  default from: 'no-reply@customerstories.net'

  TEST_EMAILS = ['***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***', '***REMOVED***']
  FOOTER_IMG_URL = "https://s3-us-west-1.amazonaws.com/csp-#{Rails.env}-assets/CS-powered-by.png"

  def request_contribution contribution
    curator = contribution.success.curator
    contributor = contribution.contributor
    template_name = contribution.role.capitalize
    template = curator.company.email_templates.where(name:template_name).take
    subject = template.subject
                      .sub("[customer_name]", contribution.success.customer.name)
                      .sub("[company_name]", curator.company.name)
    @body = populate_body template, curator, contribution, contributor
    @footer_img_url = FOOTER_IMG_URL
    # capture the template for this contribution's reminders ...
    contribution.email_contribution_request =
        EmailContributionRequest.create(   name: template_name,
                                        subject: subject,
                                           body: @body )
    send_mail curator, contributor, subject
  end

  def contribution_reminder contribution
    curator = contribution.success.curator
    contributor = contribution.contributor
    @footer_img_url = FOOTER_IMG_URL
    if contribution.status == 'request'
      subject = contribution.email_contribution_request.subject.prepend("Reminder: ")
    else
      subject = contribution.email_contribution_request.subject.prepend("Final reminder: ")
    end
    @body = contribution.email_contribution_request.body.html_safe
    send_mail curator, contributor, subject
  end

  def test_template template, curator
    @footer_img_url = "https://s3-us-west-1.amazonaws.com/csp-#{Rails.env}-assets/CS-powered-by.png"
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

  def populate_body template, curator, contribution, contributor
    host = "http://#{curator.company.subdomain}.#{ENV['HOST_NAME']}"
    referral_intro = contribution.referrer_id.present? ?
                     contribution.referrer.full_name + " referred me to you. " : ""
    template.body
            .gsub("[customer_name]", contribution.success.customer.name)
            .gsub("[company_name]", curator.company.name)
            .gsub("[product_name]", contribution.success.products.take.name)
            .gsub("[contributor_first_name]", contributor.first_name)
            .gsub("[curator_first_name]", curator.first_name)
            .gsub("[referral_intro]", referral_intro)
            .gsub("[curator_full_name]", curator.full_name)
            .gsub("[curator_email]", curator.email)
            .gsub("[curator_phone]", curator.phone || "")
            .gsub("[curator_title]", curator.title || "")
            .gsub("[curator_img_url]", curator.photo_url || "")
            .gsub("[contribution_url]", "#{host}/contributions/#{contribution.access_token}/contribution")
            .gsub("[feedback_url]", "#{host}/contributions/#{contribution.access_token}/feedback")
            .gsub("[unsubscribe_url]", "#{host}/contributions/#{contribution.access_token}/unsubscribe")
            .gsub("[opt_out_url]", "#{host}/contributions/#{contribution.access_token}/opt_out")
            .html_safe
  end

  def send_mail curator, contributor, subject
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
    mail to: recipient, from: sender, subject: subject
  end

end

