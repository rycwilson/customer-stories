namespace :temp do

  desc "temp stuff"

  task add_default_win_story: :environment do

  end

  task remove_pixlee_cta: :environment do
    pixlee = Company.find_by subdomain: 'pixlee'
    cta = /<a\shref="https:\/\/www\.pixlee\.com\/request-demo".+Blog-CTA_Request-Demo\.png'\);"><\/a>/
    pixlee.published_stories.reverse.each do |story_id|
      story = Story.find(story_id)
      if story.narrative.match(cta)
        story.update(narrative: story.narrative.sub(cta, ''))
      else
        story.touch
      end
    end
  end

  task migrate_answers: :environment do
    ContributorAnswer.destroy_all
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE contributor_answers_id_seq RESTART WITH 1')
    Contribution.where.not(contribution:[nil, '']).each do |c|
      if c.contribution.scan(/<em>(.*?)<\/em>/).present?   # earlier contributions are not based on questions
        c.contribution.scan(/<em>(.*?)<\/em>/).flatten.each_with_index do |answer, index|
          ContributorAnswer.create(
            answer: answer,
            contribution_id: c.id,
            contributor_question_id: c.company.questions[index].id
          )
        end
      end
    end
  end

  task add_default_cta_colors: :environment do
    Company.where(primary_cta_background_color: [nil, '']).each do |c|
      c.update(primary_cta_background_color: '#337ab7', primary_cta_text_color: '#ffffff')
    end
  end

  task change_contribution_status: :environment do
    Contribution.all.each do |c|
      if (c.status == 'unsubscribed')
        c.update(status: 'opted_out')
      elsif (c.status == 'opted_out')
        c.update(status: 'removed')
      end
    end
  end

  task add_onerror_to_curator_img: :environment do
    CrowdsourcingTemplate.all.each do |template|
      template.update(request_body: template.request_body.sub(/alt=\"curator photo\"/, 'onerror="this.style.display=\'none\'"'))
    end
  end

  task fix_referral_intro: :environment do
    CrowdsourcingTemplate.all.each do |template|
      template.request_body.gsub!('[referral_intro]', '[referrer_full_name] referred me to you')
      template.save
    end
  end

  task reassign_template_questions: :environment do
    # TemplatesQuestion.destroy_all
    Company.where.not(name:'CSP').each do |company|
      company.templates.each do |template|
        if ['Customer', 'Customer Success', 'Sales'].include?(template.name)
          template.questions.delete_all
          if template.name == 'Customer'
            company.questions.select { |q| q.role == 'customer' }.each do |question|
              template.questions << question
            end
          elsif template.name == 'Customer Success'
            company.questions.select { |q| q.role == 'customer success' }.each do |question|
              template.questions << question
            end
          elsif template.name == 'Sales'
            company.questions.select { |q| q.role == 'sales' }.each do |question|
              template.questions << question
            end
          end
        end
      end
    end
  end

  task copy_default_invitation_templates: :environment do
    csp = Company::CSP
    Company.all.each do |company|
      company.invitation_templates.customer.update(
        request_body: csp.invitation_templates.customer.request_body
      )
      company.invitation_templates.customer_success.update(
        request_body: csp.invitation_templates.customer_success.request_body
      )
      company.invitation_templates.sales.update(
        request_body: csp.invitation_templates.sales.request_body
      )
    end
  end

  # NOTE: disable request-related callbacks in contribution.rb before running
  task crowdsource_update: :environment do
    Rake::Task["temp:success_names"].invoke
    Rake::Task["temp:update_contributions"].invoke
    Rake::Task["temp:partner_to_customer_success"].invoke
    Rake::Task["temp:create_contributor_questions"].invoke
    Rake::Task["temp:create_invitation_templates"].invoke
    Rake::Task["temp:copy_old_contribution_requests"].invoke
    Rake::Task["temp:db_fixes"].invoke
    Rake::Task["temp:change_reminder_wait"].invoke
  end

  task change_reminder_wait: :environment do
    Contribution.all.each { |c| c.update(first_reminder_wait: 2, second_reminder_wait: 3) }
  end

  # fix any data oddities that cause errors
  task db_fixes: :environment do
    # this success and story had a \n character in the name/title that was hosing datatables search
    Success.find(27).update(name:'How to Deploy a Customer Reference Application for Your Sales Team')
    Success.find(27).story.update(title:'How to Deploy a Customer Reference Application for Your Sales Team')
    Contribution.where(status: nil).destroy_all
  end

  task copy_old_contribution_requests: :environment do
    EmailContributionRequest.all.each do |contribution_request|
      contribution_request.contribution.update(
        # invitation_template_id: nil,
        request_subject: contribution_request.subject,
        request_body: contribution_request.body,
        request_sent_at: contribution_request.created_at
      )
    end
  end

  task create_invitation_templates: :environment do
    CrowdsourcingTemplate.destroy_all
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE invitation_templates_id_seq RESTART WITH 1')
    EmailTemplate.all.each do |email_template|
      CrowdsourcingTemplate.create(
        name: email_template.name,
        request_subject: email_template.subject,
        request_body: email_template.body
                        .gsub('[contribution_url]', '[contribution_submission_url]')
                        .gsub('[feedback_url]', '[feedback_submission_url]')
                        .gsub('[curator_title]', '[curator_position]')
                        .gsub(/([a-zA-Z]|\s|\.)+<\/a>/, 'Link text goes here</a>'),
        company_id: email_template.company_id
      )
    end
    Company.all.each do |company|
      customer_template = company.invitation_templates.select { |t| t.name == 'Customer' }[0]
      customer_success_template = company.invitation_templates.select { |t| t.name == 'Customer Success' }[0]
      sales_template = company.invitation_templates.select { |t| t.name == 'Sales' }[0]
      company.contributor_questions.each do |q|
        if q.role == 'customer'
          customer_template.contributor_questions << q
        elsif q.role == 'customer success'
          customer_success_template.contributor_questions << q
        elsif q.role == 'sales'
          sales_template.contributor_questions << q
        end
      end
      company.contributions.each do |contribution|
        if contribution.role == 'customer'
          contribution.update(invitation_template_id: customer_template.id)
        elsif contribution.role == 'customer success'
          contribution.update(invitation_template_id: customer_success_template.id)
        elsif contribution.role == 'sales'
          contribution.update(invitation_template_id: sales_template.id)
        end
      end
    end
  end

  task create_contributor_questions: :environment do
    ContributorQuestion.destroy_all
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE contributor_questions_id_seq RESTART WITH 1')
    Company.all.each do |company|
      company.contributor_questions =
        ContributorQuestion.create(question: "What was the challenge or disruption requiring action?", role: 'customer'),
        ContributorQuestion.create(question: "What were the hurdles to solving the challenge?", role: 'customer'),
        ContributorQuestion.create(question: "What was the journey to solving the challenge?", role: 'customer'),
        ContributorQuestion.create(question: "What were the positive outcomes for you and the company?", role: 'customer'),
        ContributorQuestion.create(question: "What was the customer’s challenge or disruption requiring action?", role: 'customer success'),
        ContributorQuestion.create(question: "What were the customer’s hurdles to solving the challenge?", role: 'customer success'),
        ContributorQuestion.create(question: "What was your joint journey to helping them solve the challenge?", role: 'customer success'),
        ContributorQuestion.create(question: "What were the positive outcomes for the stakeholders and the company?", role: 'customer success'),
        ContributorQuestion.create(question: "What was the customer’s challenge or disruption requiring action?", role: 'sales'),
        ContributorQuestion.create(question: "What were the customer’s hurdles to solving the challenge?", role: 'sales'),
        ContributorQuestion.create(question: "What was your joint journey to helping them solve the challenge?", role: 'sales'),
        ContributorQuestion.create(question: "What were the positive outcomes for the stakeholders and the company?", role: 'sales')
    end
  end

  task partner_to_customer_success: :environment do
    EmailTemplate.where(name:'Partner').each { |t| t.update(name:'Customer Success') }
    Contribution.where(role:'partner').each { |c| c.update(role:'customer success') }
  end

  task update_contributions: :environment do
    Contribution.all.each() do |contribution|
      # ensure no blank roles
      contribution.update(role: 'customer') if contribution.role.blank?
      new_status = contribution.status  # default to the existing value
      case contribution.status
        when 'remind1'
          new_status = 'first_reminder_sent'
        when 'remind2'
          new_status = 'second_reminder_sent'
        when 'contribution'
          new_status = 'contribution_submitted'
        when 'feedback'
          new_status = 'feedback_submitted'
        when 'unsubscribe'
          new_status = 'unsubscribed'
        when 'opt_out'
          new_status = 'opted_out'
      end
      # change access token to make it url safe
      contribution.update(status: new_status, access_token: SecureRandom.urlsafe_base64)
    end
  end

  task success_names: :environment do
    Success.all.each() do |success|
      if success.name.blank? && success.story.present?
        success.update(name: success.story.title)
      elsif success.name.blank?
        success.update(name: success.customer.name + ' - Customer Win')
      end
    end
  end

  task make_widgets: :environment do
    Company.all.each do |company|
      case company.subdomain
      when 'trunity'
        tab_color = '#FEBE57'
      when 'compas'
        tab_color = '#e55f53'
      when 'varmour'
        tab_color = '#60ccf3'
      when 'centerforcustomerengagement'
        tab_color = '#007fc5'
      when 'zeniq'
        tab_color = '#364150'
      when 'corefact'
        tab_color = '#1f9421'
      when 'saucelabs'
        tab_color = '#e2231a'
      when 'juniper'
        tab_color = '#3493c1'
      when 'neonova'
        tab_color = '#669bb2'
      when 'kodacon'
        tab_color = '#85cee6'
      when 'zoommarketing'
        tab_color = '#9e61a8'
      when 'modeanalytics'
        tab_color = '#37b067'
      when 'acme-test'
        tab_color = '#ff0000'
      else
        tab_color = 'rgb(14, 122, 254)'
      end
      company.create_widget(tab_color: tab_color, text_color:'#ffffff')
    end
  end

  task cta: :environment do

    # OutboundAction -> CallToAction
    OutboundAction.all.each do |action|
      if action.type == 'OutboundLink'
        type = 'CTALink'
      elsif action.type == 'OutboundForm'
        type = 'CTAForm'
      else
        puts "No type: #{action}"
      end
      new_cta = action.attributes.reject { |attribute| attribute == 'id' }
      new_cta['type'] = type
      CallToAction.create(new_cta)
    end

    OutboundActionsStory.all.each do |entry|
      success_id = Story.find(entry.story_id).success.id
      action = OutboundAction.find(entry.outbound_action_id)
      type = 'CTALink' if action.type == 'OutboundLink'
      type = 'CTAForm' if action.type == 'OutboundForm'
      if action.description.present?
        description = action.description
      else
        description = action.display_text
      end
      cta_id = CallToAction.where({ company_id: action.company_id,
                                    description: description,
                                    type: type }).take.id
      CtasSuccess.create({
        call_to_action_id: cta_id,
        success_id: success_id
      })
    end

    CtaButton.all.each do |button|
      CallToAction.create({
        company_primary: true,
        type: 'CTALink',
        company_id: button.company_id,
        description: button.btn_text,
        link_url: button.url,
        display_text: button.btn_text
      })
      button.company.update({
        primary_cta_background_color: button.background_color,
        primary_cta_text_color: button.color
      })
    end

  end

end
