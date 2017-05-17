
namespace :adwords do

  desc "adwords tasks"

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

      if company.subdomain == 'varmour'
        varmour_params = {
          short_headline: 'vArmour Customer Stories',
          adwords_logo_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/7125d063-0f87-4d08-912d-ad62e281773f/varmour_1200x1200.png",
          adwords_logo_media_id: prod_env ? 2828012141 : 2751663760,
          topic_campaign_id: prod_env ? 793486453 : 794123279,
          topic_ad_group_id: prod_env ? 36788533410 : 40779259429,
          retarget_campaign_id: prod_env ? 707716477 : 794134055,
          retarget_ad_group_id: prod_env ? 37631594860 : 38074094381,
          default_image_url: "https://csp-development-assets.s3-us-west-1.amazonaws.com/uploads/122dadec-7229-4d1c-a3fc-1e71e0ff9a16/varmour-existing.jpeg",
          default_image_media_id: prod_env ? 2828013101 : 2820465306
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
          short_headline: 'RetailNext Stories',
          adwords_logo_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/aa352ac1-9063-4c6b-a4d1-fb138bcc440d/retailnext_1200x1200.png",
          adwords_logo_media_id: 2830867372,
          topic_campaign_id: 809400874,
          topic_ad_group_id: 41759621037,
          retarget_campaign_id: 810346782,
          retarget_ad_group_id: 44629811671,
          default_image_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/1f398239-e32f-4ae6-b3d1-224dbde4b9e6/retailnext_landscape_1.png",
          default_image_media_id: 2829811191
        }
        company.update(
          adwords_short_headline: retailnext_params[:short_headline],
          adwords_logo_url: retailnext_params[:adwords_logo_url],
          adwords_logo_media_id: retailnext_params[:adwords_logo_media_id]
        )
        company.adwords_images.create(
          company_default: true, image_url: retailnext_params[:default_image_url],
          media_id: retailnext_params[:default_image_media_id]
        )
        company.campaigns.create(
          type: 'TopicCampaign', status: 'PAUSED',
          campaign_id: retailnext_params[:topic_campaign_id], name: 'retailnext display topic'
        )
        company.campaigns.create(
          type:'RetargetCampaign', status: 'PAUSED',
          campaign_id: retailnext_params[:retarget_campaign_id], name: 'vamour display retarget'
        )
        company.campaigns.topic.create_adwords_ad_group(
          status: 'ENABLED', ad_group_id: retailnext_params[:topic_ad_group_id],
          name: 'retailnext display topic ad group'
        )
        company.campaigns.retarget.create_adwords_ad_group(
          status: 'ENABLED', ad_group_id: retailnext_params[:retarget_ad_group_id],
          name: 'retailnext display retarget ad group'
        )

      # all others
      else
        short_headline = "#{company.name} Customer Stories"
        short_headline = short_headline.length <= 25 ? short_headline : nil
        company.update(adwords_short_headline: short_headline)
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
        story_id: story.id, long_headline: story.title,
        adwords_ad_group_id: story.company.campaigns.topic.ad_group.ad_group_id
      )
      story.company.campaigns.retarget.ad_group.ads.create(
        story_id: story.id, long_headline: story.title,
        adwords_ad_group_id: story.company.campaigns.retarget.ad_group.ad_group_id
      )
    end

    # create ads
    varmour = Company.find_by(subdomain: 'varmour')
    retailnext = Company.find_by(subdomain: 'retailnext')

    # production ads
    if prod_env
      [varmour, retailnext].each() do |company|
        company.ads.each() do |ad|
          ad.adwords_image = company.adwords_images.default
          campaign_type = ad.campaign.type == 'TopicCampaign' ? 'topic' : 'retarget'
          AdwordsController.new::create_ad(company, ad.story, campaign_type)
          # enabled ads
          if [7, 213, 225, 232, 233, 240].include?(ad.story.id)
            ad.update(status: 'ENABLED')
            AdwordsController.new::update_ad_status(ad)
          end
        end
      end

    # only varmour on adwords test account
    else
      varmour.ads.each() do |ad|
        ad.adwords_image = varmour.adwords_images.default
        campaign_type = ad.campaign.type == 'TopicCampaign' ? 'topic' : 'retarget'
        AdwordsController.new::create_ad(varmour, ad.story, campaign_type)
        # enabled ads
        if [7, 213, 225].include?(ad.story.id)
          ad.update(status: 'ENABLED')
          AdwordsController.new::update_ad_status(ad.reload)  # get the ad_id since it was updated
        end
      end

    end  # create_ads

  end  # seed task

end  # adwords namespace