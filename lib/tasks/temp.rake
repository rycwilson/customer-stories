namespace :temp do

  desc "temp stuff"

  # NOTE - change id values for production environment
  task adwords: :environment do
    prod_env = (ENV['ADWORDS_ENV'] == 'production')

    AdwordsCampaign.destroy_all
    AdwordsAdGroup.destroy_all
    AdwordsAd.destroy_all

    Company.find_by(subdomain:'varmour').update(promote_tr: true)
    Company.find_by(subdomain:'retailnext').update(promote_tr: true)

    Company.all.each do |company|
      company.update(adwords_short_headline: company.name + ' Customer Stories')

      if company.subdomain == 'varmour'
        varmour_params = {
          topic_campaign_id: prod_env ? 1234 : 794123279,
          topic_ad_group_id: prod_env ? 1234 : 40779259429,
          retarget_campaign_id: prod_env ? 1234 : 794134055,
          retarget_ad_group_id: prod_env ? 1234 : 38074094381,
          adwords_logo_media_id: prod_env ? 1234 : 2751663760
        }
        company.update(adwords_logo_media_id: varmour_params[:adwords_logo_media_id])
        company.campaigns.create(
          type:'TopicCampaign', status: 'ENABLED',
          campaign_id: varmour_params[:topic_campaign_id], name: 'varmour display topic'
        )
        company.campaigns.create(
          type:'RetargetCampaign', status: 'ENABLED',
          campaign_id: varmour_params[:retarget_campaign_id], name: 'vamour display retarget'
        )
        company.campaigns.topic.create_adwords_ad_group(
          ad_group_id: varmour[:topic_ad_group_id], status: 'ENABLED', name: 'varmour ad group display topic'
        )
        company.campaigns.retarget.create_adwords_ad_group(
          ad_group_id: varmour[:retarget_ad_group_id], status: 'ENABLED', name: 'varmour ad group display retarget'
        )

      elsif company.subdomain == 'retailnext' && prod_env
        retailnext_params = {
          topic_campaign_id: prod_env ? 1234 : 5678,
          topic_ad_group_id: prod_env ? 1234 : 5678,
          retarget_campaign_id: prod_env ? 1234 : 5678,
          retarget_ad_group_id: prod_env ? 1234 : 5678,
          adwords_logo_media_id: prod_env ? 1234 : 5678
        }
        company.update(adwords_logo_media_id: retailnext_params[:adwords_logo_media_id])
        company.campaigns.create(
          type:'TopicCampaign', status: 'ENABLED',
          campaign_id: retailnext_params[:topic_campaign_id], name: 'retailnext display topic'
        )
        company.campaigns.create(
          type:'RetargetCampaign', status: 'ENABLED',
          campaign_id: retailnext_params[:retarget_campaign_id], name: 'vamour display retarget'
        )
        company.campaigns.topic.create_adwords_ad_group(
          ad_group_id: retailnext[:topic_ad_group_id], status: 'ENABLED', name: 'retailnext ad group display topic'
        )
        company.campaigns.retarget.create_adwords_ad_group(
          ad_group_id: retailnext[:retarget_ad_group_id], status: 'ENABLED', name: 'retailnext ad group display retarget'
        )

      # all others
      else
        company.campaigns.create(type:'TopicCampaign')
        company.campaigns.create(type:'RetargetCampaign')
        company.campaigns.topic.create_adwords_ad_group()
        company.campaigns.retarget.create_adwords_ad_group()
      end
    end

    # all published stories have a Sponsored Story;
    # status defaults to PAUSED, and will stay that way for non-subscribers
    Story.where(published: true).each do |story|
      story.company.campaigns.topic.ad_group.ads.create(
        story_id: story.id, long_headline: story.title
      )
      story.company.campaigns.retarget.ad_group.ads.create(
        story_id: story.id, long_headline: story.title
      )
    end

    if prod_env
      # production ads
    else
      # varmour - equens - test
      AdwordsAd.joins( adwords_ad_group: { adwords_campaign: {} } )
               .where( story_id: 7, adwords_campaigns: { type: 'TopicCampaign' } ).take
               .update( ad_id: 191118170285 )
      AdwordsAd.joins( adwords_ad_group: { adwords_campaign: {} } )
               .where( story_id: 7, adwords_campaigns: { type: 'RetargetCampaign' } ).take
               .update( ad_id: 191152234528 )
      # Story.find(7).adwords_image.update(media_id: 2749038420)

      # varmour - john muir - test
      AdwordsAd.joins( adwords_ad_group: { adwords_campaign: {} } )
               .where( story_id: 213, adwords_campaigns: { type: 'TopicCampaign' } ).take
               .update( ad_id: 193403020234 )
      AdwordsAd.joins( adwords_ad_group: { adwords_campaign: {} } )
               .where( story_id: 213, adwords_campaigns: { type: 'RetargetCampaign' } ).take
               .update( ad_id: 191119635492 )
      # Story.find(213).adwords_image.update(media_id: 2749038420)

      # varmour - fortune100 - test
      AdwordsAd.joins( adwords_ad_group: { adwords_campaign: {} } )
               .where( story_id: 225, adwords_campaigns: { type: 'TopicCampaign' } ).take
               .update( ad_id: 193374900161 )
      AdwordsAd.joins( adwords_ad_group: { adwords_campaign: {} } )
               .where( story_id: 225, adwords_campaigns: { type: 'RetargetCampaign' } ).take
               .update( ad_id: 191119770138 )
      # Story.find(225).adwords_image.update(media_id: 2749038420)
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
