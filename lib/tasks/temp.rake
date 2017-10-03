namespace :temp do

  desc "temp stuff"

  task update_contributions: :environment do
    Contribution.all.each() do |contribution|
      case contribution.status
        when 'contribution'
          new_status = 'contribution_submitted'
        when 'feedback'
          new_status = 'feedback_submitted'
        when 'unsubscribe'
          new_status = 'unsubscribed'
        when 'opt_out'
          new_status = 'opted_out'
        when 'unsubscribe'
          new_status = 'unsubscribed'
      end
      contribution.update(status: new_status, access_token: SecureRandom.urlsafe_base64)
  end

  # fix any data oddities that cause errors
  task db_fixes: :environment do
    # this success and story had a \n character in the name/title that was hosing datatables search
    Success.find(27).update(name:'How to Deploy a Customer Reference Application for Your Sales Team')
    Success.find(27).story.update(title:'How to Deploy a Customer Reference Application for Your Sales Team')
  end


  task create_crowdsourcing_templates: :environment do
    CrowdsourcingTemplate.destroy_all
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
      customer_template = company.crowdsourcing_templates.select { |t| t.name == 'Customer' }[0]
      customer_success_template = company.crowdsourcing_templates.select { |t| t.name == 'Customer Success' }[0]
      sales_template = company.crowdsourcing_templates.select { |t| t.name == 'Sales' }[0]
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
        # TODO: Should be ok for a contributor not to have a template, as this may happen with
        # curators. But this causes errors with datatables
        contribution.update(role: 'customer') if contribution.role.blank?
        if contribution.role == 'customer'
          contribution.update(crowdsourcing_template_id: customer_template.id)
        elsif contribution.role == 'customer success'
          contribution.update(crowdsourcing_template_id: customer_success_template.id)
        elsif contribution.role == 'sales'
          contribution.update(crowdsourcing_template_id: sales_template.id)
        end
      end
    end
  end

  task create_contributor_questions: :environment do
    ContributorQuestion.destroy_all
    Company.all.each do |company|
      company.contributor_questions =
        ContributorQuestion.create(question: "What was the challenge?", role: 'customer'),
        ContributorQuestion.create(question: "What was the solution?", role: 'customer'),
        ContributorQuestion.create(question: "What was the measure of success achieved?", role: 'customer'),
        ContributorQuestion.create(question: "Would you recommend it to a friend?", role: 'customer'),
        ContributorQuestion.create(question: "Customer Success question #1", role: 'customer success'),
        ContributorQuestion.create(question: "Customer Success question #2", role: 'customer success'),
        ContributorQuestion.create(question: "Customer Success question #3", role: 'customer success'),
        ContributorQuestion.create(question: "Customer Success question #4", role: 'customer success'),
        ContributorQuestion.create(question: "Sales question #1", role: 'sales'),
        ContributorQuestion.create(question: "Sales question #2", role: 'sales'),
        ContributorQuestion.create(question: "Sales question #3", role: 'sales'),
        ContributorQuestion.create(question: "Sales question #4", role: 'sales')
    end
  end

  task partner_to_customer_success: :environment do
    EmailTemplate.where(name:'Partner').each { |t| t.update(name:'Customer Success') }
    Contribution.where(role:'partner').each { |c| c.update(role:'customer success') }
  end

  task success_names: :environment do
    Success.all.each() do |success|
      if success.name.blank? && success.story.present?
        success.update(name: success.story.title)
      elsif success.name.blank?
        success.update(name: success.customer.name + ' - Customer Success')
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
