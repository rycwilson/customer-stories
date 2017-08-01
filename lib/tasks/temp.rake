namespace :temp do

  desc "temp stuff"

  task et_assign: :environment do
    retailnext = Company.find_by(subdomain:'retailnext')
    retailnext.contributions.each() do |c|
      if c.role.blank?
        c.update(role: 'blank', email_template_id: rand(76..78))
      else
        c.update(email_template_id: rand(76..78))
      end
    end
    cce = Company.find_by(subdomain:'centerforcustomerengagement')
    cce.contributions.each() do |c|
      if c.role.blank?
        c.update(role: 'blank', email_template_id: rand(76..78))
      else
        c.update(email_template_id: rand(76..78))
      end
    end
    varmour = Company.find_by(subdomain:'varmour')
    varmour.contributions.each() do |c|
      if c.role.blank?
        c.update(role: 'blank', email_template_id: rand(76..78))
      else
        c.update(email_template_id: rand(76..78))
      end
    end
    acme = Company.find_by(subdomain:'acme-test')
    acme.contributions.each() do |c|
      if c.role.blank?
        c.update(role: 'blank', email_template_id: rand(76..78))
      else
        c.update(email_template_id: rand(76..78))
      end
    end
    trunity = Company.find_by(subdomain:'trunity')
    trunity.contributions.each() do |c|
      if c.role.blank?
        c.update(role: 'blank', email_template_id: rand(76..78))
      else
        c.update(email_template_id: rand(76..78))
      end
    end
    cce = Company.find_by(subdomain:'centerforcustomerengagement')
    cce.contributions.each() do |c|
      if c.role.blank?
        c.update(role: 'blank', email_template_id: rand(91..93))
      else
        c.update(email_template_id: rand(91..93))
      end
    end
  end

  task success_names: :environment do
    Success.all.each() do |success|
      if success.story.present?
        success.update(name: success.story.title)
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
