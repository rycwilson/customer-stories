namespace :temp do

  desc "temp stuff"


  task adwords: :environment do
    # Company.all.each do |company|
    #   company.update(adwords_short_headline: company.name + ' Customer Stories')
    # end
    # Story.where(published: true).each do |story|
    #   story.create_adwords_config(long_headline: story.title)
    # end
    # Company.find_by(subdomain:'varmour').update(promote_tr: true)
    # Company.find_by(subdomain:'retailnext').update(promote_tr: true)
    # note these are ads from test account!

    # varmour - equens
    Story.find(7).adwords_config.update(topic_ad_group_id: 40779259429, topic_ad_id: 191118170285, retarget_ad_group_id: 38074094381, retarget_ad_id: 191152234528 )
    # Story.find(7).adwords_image.update(media_id: 2749038420)

    # varmour - john muir
    Story.find(213).adwords_config.update(topic_ad_group_id: 40779259429,topic_ad_id: 193403020234, retarget_ad_group_id: 38074094381, retarget_ad_id: 191119635492 )
    # Story.find(213).adwords_image.update(media_id: 2749038420)

    # varmour - fortune100
    Story.find(225).adwords_config.update(topic_ad_group_id: 40779259429, topic_ad_id: 193374900161, retarget_ad_group_id: 38074094381, retarget_ad_id: 191119770138 )
    # Story.find(225).adwords_image.update(media_id: 2749038420)

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
