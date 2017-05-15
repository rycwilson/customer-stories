namespace :adwords do

  desc "adwords tasks"

  # NOTE - change id values for production environment
  task seed: :environment do

  prod_env = (ENV['ADWORDS_ENV'] == 'production')

  AdwordsCampaign.destroy_all
  AdwordsAdGroup.destroy_all
  AdwordsAd.destroy_all
  AdwordsImage.destroy_all

  Company.find_by(subdomain:'varmour').update(promote_tr: true)
  Company.find_by(subdomain:'retailnext').update(promote_tr: true)

  # create campaigns, ad groups, images
  Company.all.each do |company|
    short_headline = "#{company.name} Customer Stories"
    short_headline = short_headline.length <= 25 ? short_headline : nil
    company.update(adwords_short_headline: short_headline)
    if company.subdomain == 'varmour'
      varmour_params = {
        short_headline: 'vArmour Customer Stories',
        adwords_logo_url: prod_env ? "" : "https://csp-development-assets.s3-us-west-1.amazonaws.com/uploads/bc2d8727-aab9-4825-a7da-0fd3386bcfc0/varmour_1200x1200.png",
        adwords_logo_media_id: prod_env ? 1234 : 2751663760,
        topic_campaign_id: prod_env ? 1234 : 794123279,
        topic_ad_group_id: prod_env ? 1234 : 40779259429,
        retarget_campaign_id: prod_env ? 1234 : 794134055,
        retarget_ad_group_id: prod_env ? 1234 : 38074094381,
        default_image_url: prod_env ? "" : "https://csp-development-assets.s3-us-west-1.amazonaws.com/uploads/122dadec-7229-4d1c-a3fc-1e71e0ff9a16/varmour-existing.jpeg",
        default_image_media_id: prod_env ? 1234 : 2820465306
      }
      company.update(
        adwords_short_headline: varmour_params[:short_headline],
        adwords_logo_url: varmour_params[:adwords_logo_url],
        adwords_logo_media_id: varmour_params[:adwords_logo_media_id]
      )
      company.adwords_images.create(
        company_default: true, image_url: varmour_params[:default_image_url],
        media_id: varmour_params[:default_image_media_id]
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
        company_default: true, image_url: retailnext_params[:default_image_url],
        media_id: 123
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
    # varmour
    varmour = Company.find(10)
    varmour.stories.published
      .each do |story|
        story.ads.adwords_image = varmour.adwords_images.default
        ['topic', 'retarget'].each do |campaign_type|
          AdwordsController.new::create_ad(varmour, story, campaign_type)
        end
      end

  end  # create_ads

  end

end