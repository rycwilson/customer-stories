class UserMailer < ApplicationMailer

  default from: 'no-reply@customerstories.net'

  def request_contribution contribution
    curator = contribution.success.curator
    contributor = contribution.contributor
    referral_intro = contribution.referrer_id.present? ? contribution.referrer.full_name + " referred me to you. " : ""
    story_example_id = Story.find_example
    host = "http://#{curator.company.subdomain}.#{ENV['HOST_NAME']}"
    template_name = contribution.role.capitalize + " - initial contribution request"
    template = curator.company.email_templates.where(name:template_name).take
    @footer_img_url = "https://s3-us-west-1.amazonaws.com/csp-#{Rails.env}-assets/CS-powered-by.png"
    subject = template.subject
                .sub("[customer_name]", contribution.success.customer.name)
                .sub("[company_name]", curator.company.name)
    @body = template.body
              .gsub("[customer_name]", contribution.success.customer.name)
              .gsub("[company_name]", curator.company.name)
              .gsub("[product_name]", contribution.success.products.take.name)
              .gsub("[contributor_first_name]", contributor.first_name)
              .gsub("[curator_first_name]", curator.first_name)
              .gsub("[referral_intro]", referral_intro)
              .gsub("[contribution_url]", "#{host}/contributions/#{contribution.access_token}/contribution")
              .gsub("[feedback_url]", "#{host}/contributions/#{contribution.access_token}/feedback")
              .gsub("[curator_full_name]", curator.full_name)
              .gsub("[curator_email]", curator.email)
              .gsub("[curator_phone]", curator.phone || "")
              .gsub("[curator_title]", curator.title || "")
              .gsub("[story_example_url]", "#{host}/stories/#{story_example_id}")
              .gsub("[unsubscribe_url]", "#{host}/contributions/#{contribution.access_token}/unsubscribe")
              .gsub("[opt_out_url]", "#{host}/contributions/#{contribution.access_token}/opt_out")
              .gsub("[curator_img_url]", curator.photo_url || "")
              .html_safe

    if ENV['HOST_NAME'] == 'customerstories.org'  # staging
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

  def contribution_reminder contribution
    curator = contribution.success.curator
    contributor = contribution.contributor
    host = "http://#{curator.company.subdomain}.#{ENV['HOST_NAME']}"
    if contribution.status == 'request'
      template_name = contribution.role.capitalize + " - first contribution reminder"
    elsif contribution.status == 'remind1'
      template_name = contribution.role.capitalize + " - second contribution reminder"
    else
      # error
    end
    template = curator.company.email_templates.where(name:template_name).take
    @footer_img_url = "https://s3-us-west-1.amazonaws.com/csp-#{Rails.env}-assets/CS-powered-by.png"
    subject = template.subject
                .sub("[customer_name]", contribution.success.customer.name)
                .sub("[company_name]", curator.company.name)
    @body = template.body
              .sub("[contributor_first_name]", contributor.first_name)
              .sub("[contribution_url]", "#{host}/contributions/#{contribution.access_token}/contribution")
              .sub("[feedback_url]", "#{host}/contributions/#{contribution.access_token}/feedback")
              .sub("[opt_out_url]", "#{host}/contributions/#{contribution.access_token}/opt_out")
              .html_safe

    if ENV['HOST_NAME'] == 'customerstories.org'  # staging
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

  end # contribution_reminder

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

end

