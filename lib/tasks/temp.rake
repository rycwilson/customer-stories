namespace :temp do

  desc "temp stuff"

  # NOTE - change id values for production environment
  task adwords: :environment do
    prod_env = (ENV['ADWORDS_ENV'] == 'production')

    AdwordsCampaign.destroy_all
    AdwordsAdGroup.destroy_all
    AdwordsAd.destroy_all
    AdwordsImage.destroy_all

    Company.find_by(subdomain:'varmour').update(promote_tr: true)
    Company.find_by(subdomain:'retailnext').update(promote_tr: true)

    # create campaigns, ad groups, images
    Company.all.each do |company|
      if company.subdomain == 'varmour'
        varmour_params = {
          short_headline: 'vArmour Customer Stories',
          adwords_logo_url: prod_env ? "" : "https://csp-development-assets.s3-us-west-1.amazonaws.com/uploads/a33fc278-1b4f-42e9-8af9-47b605d2a200/varmour_1200x1200.png",
          adwords_logo_media_id: prod_env ? 1234 : 2818593977,
          topic_campaign_id: prod_env ? 1234 : 794123279,
          topic_ad_group_id: prod_env ? 1234 : 40779259429,
          retarget_campaign_id: prod_env ? 1234 : 794134055,
          retarget_ad_group_id: prod_env ? 1234 : 38074094381,
          default_image_url: prod_env ? "" : "https://csp-development-assets.s3-us-west-1.amazonaws.com/uploads/80402b7c-0436-405d-97ca-29a983055c6c/varmour-existing.jpeg",
          default_image_media_id: prod_env ? 1234 : 2749038420
        }
        company.update(
          adwords_short_headline: varmour_params[:short_headline],
          adwords_logo_url: varmour_params[:adwords_logo_url],
          adwords_logo_media_id: varmour_params[:adwords_logo_media_id]
        )
        company.adwords_images.create(
          company_default: true, image_url: varmour_params[:default_image_url]
        )
        company.campaigns.create(
          type:'TopicCampaign', status: prod_env ? 'ENABLED' : 'PAUSED',
          campaign_id: varmour_params[:topic_campaign_id], name: 'varmour display topic'
        )
        company.campaigns.create(
          type:'RetargetCampaign', status: prod_env ? 'ENABLED' : 'PAUSED',
          campaign_id: varmour_params[:retarget_campaign_id], name: 'vamour display retarget'
        )
        company.campaigns.topic.create_adwords_ad_group(
          ad_group_id: varmour_params[:topic_ad_group_id], status: 'ENABLED', name: 'varmour ad group display topic'
        )
        company.campaigns.retarget.create_adwords_ad_group(
          ad_group_id: varmour_params[:retarget_ad_group_id], status: 'ENABLED', name: 'varmour ad group display retarget'
        )

      elsif company.subdomain == 'retailnext' && prod_env
        retailnext_params = {
          short_headline: '',
          adwords_logo_url: prod_env ? '' : '',
          adwords_logo_media_id: prod_env ? 1234 : 5678,
          topic_campaign_id: prod_env ? 1234 : 5678,
          topic_ad_group_id: prod_env ? 1234 : 5678,
          retarget_campaign_id: prod_env ? 1234 : 5678,
          retarget_ad_group_id: prod_env ? 1234 : 5678,
          default_image_url: prod_env ? '' : '',
          default_image_media_id: prod_env ? 1234 : 5678
        }
        company.update(
          adwords_short_headline: retailnext_params[:short_headline],
          adwords_logo_url: retailnext_params[:adwords_logo_url],
          adwords_logo_media_id: retailnext_params[:adwords_logo_media_id]
        )
        company.adwords_images.create(
          company_default: true, image_url: retailnext_params[:default_image_url]
        )
        company.campaigns.create(
          type:'TopicCampaign', status: 'ENABLED',
          campaign_id: retailnext_params[:topic_campaign_id], name: 'retailnext display topic'
        )
        company.campaigns.create(
          type:'RetargetCampaign', status: 'ENABLED',
          campaign_id: retailnext_params[:retarget_campaign_id], name: 'vamour display retarget'
        )
        company.campaigns.topic.create_adwords_ad_group(
          ad_group_id: retailnext_params[:topic_ad_group_id], status: 'ENABLED', name: 'retailnext ad group display topic'
        )
        company.campaigns.retarget.create_adwords_ad_group(
          ad_group_id: retailnext_params[:retarget_ad_group_id], status: 'ENABLED', name: 'retailnext ad group display retarget'
        )

      # all others
      else
        # don't bother creating the short headline because it may be too long
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

    # create ads
    if prod_env
      # production ads
    else
      equens = Story.find(7)
      equens.ads.each do |ad|
        if ad.ad_group.campaign.type == 'TopicCampaign'
          ad.update(ad_id: 191118170285)
        else
          ad.update(ad_id: 191152234528)
        end
        ad.adwords_image = equens.company.adwords_images.default
      end
      johnmuir = Story.find(213)
      johnmuir.ads.each do |ad|
        if ad.ad_group.campaign.type == 'TopicCampaign'
          ad.update(ad_id: 193403020234)
        else
          ad.update(ad_id: 191119635492)
        end
        ad.adwords_image = johnmuir.company.adwords_images.default
      end
      fortune100 = Story.find(225)
      fortune100.ads.each do |ad|
        if ad.ad_group.campaign.type == 'TopicCampaign'
          ad.update(ad_id: 193374900161)
        else
          ad.update(ad_id: 191119770138)
        end
        ad.adwords_image = fortune100.company.adwords_images.default
      end
    end  # create_ads

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
