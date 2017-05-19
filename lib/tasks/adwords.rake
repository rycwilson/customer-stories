
namespace :adwords do

  desc "adwords tasks"

  task seed: :environment do

    AdwordsCampaign.destroy_all
    AdwordsAdGroup.destroy_all
    AdwordsAd.destroy_all
    AdwordsImage.destroy_all
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE adwords_campaigns_id_seq RESTART WITH 1')
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE adwords_ad_groups_id_seq RESTART WITH 1')
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE adwords_ads_id_seq RESTART WITH 1')
    ActiveRecord::Base.connection.execute('ALTER SEQUENCE adwords_images_id_seq RESTART WITH 1')

    varmour = Company.find_by(subdomain: 'varmour')
    varmour.update(promote_tr: true)
    retailnext = Company.find_by(subdomain: 'retailnext')
    retailnext.update(promote_tr: true)

    # create campaigns, ad groups, images
    Company.all.each do |company|

      company_seeds = company_seeds_lookup(company, ENV['ADWORDS_ENV'])

      if company == varmour || (company == retailnext && ENV['ADWORDS_ENV'] == 'production')

        ac = AdwordsController.new

        # short headline, logo, default image
        company.update(
          adwords_short_headline: company_seeds[:short_headline],
          adwords_logo_url: company_seeds[:adwords_logo_url],
          adwords_logo_media_id: company_seeds[:adwords_logo_media_id]
        )
        company.adwords_images.create(
          company_default: true, image_url: company_seeds[:default_image_url],
          media_id: company_seeds[:default_image_media_id]
        )

        # topic campaign / ad group / ads
        topic_campaign = ac::get_campaign(company, 'topic')
        company.campaigns.create(
          type: 'TopicCampaign', status: topic_campaign[:status],
          campaign_id: topic_campaign[:id], name: topic_campaign[:name]
        )
        topic_ad_group = ac::get_ad_group(topic_campaign[:id])
        company.campaigns.topic.create_adwords_ad_group(
          ad_group_id: topic_ad_group[:id], status: topic_ad_group[:status],
          name: topic_ad_group[:name]
        )
        topic_ads = ac::get_ads(topic_ad_group[:id])

        # retarget campaign / ad group / ads
        retarget_campaign = ac::get_campaign(company, 'retarget')
        company.campaigns.create(
          type: 'RetargetCampaign', status: retarget_campaign[:status],
          campaign_id: retarget_campaign[:id], name: retarget_campaign[:name]
        )
        retarget_ad_group = ac::get_ad_group(retarget_campaign[:id])
        company.campaigns.retarget.create_adwords_ad_group(
          ad_group_id: retarget_ad_group[:id], status: retarget_ad_group[:status],
          name: retarget_ad_group[:name]
        )
        retarget_ads = ac::get_ads(retarget_ad_group[:id])

        create_csp_ads(company, topic_ads, retarget_ads)

      # retailnext - staging
      elsif company == retailnext && ENV['ADWORDS_ENV'] == 'test'
        company.update(
          adwords_short_headline: company_seeds[:short_headline],
          adwords_logo_url: company_seeds[:adwords_logo_url],
          adwords_logo_media_id: company_seeds[:adwords_logo_media_id]
        )
        company.adwords_images.create(
          company_default: true, image_url: company_seeds[:default_image_url],
          media_id: company_seeds[:default_image_media_id]
        )
        company.campaigns.create(type:'TopicCampaign')
        company.campaigns.topic.create_adwords_ad_group()
        company.campaigns.create(type:'RetargetCampaign')
        company.campaigns.retarget.create_adwords_ad_group()

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

    ##
    ##  all published stories have a Sponsored Story;
    ##  status defaults to PAUSED, and will stay that way for non-subscribers
    ##
    ##  in the case of subscribers:
    ##  - skip this part if an ad was already created
    ##  - create the csp ad AND an adwords ad if it wasn't
    ##
    Company.all.each do |company|
      if company == varmour ||
         (company == retailnext && ENV['ADWORDS_ENV'] == 'production')
        company.stories.published.each do |story|
          unless story.ads.present?
            story.company.campaigns.topic.ad_group.ads.create(
              story_id: story.id, long_headline: story.title
            )
            story.company.campaigns.retarget.ad_group.ads.create(
              story_id: story.id, long_headline: story.title
            )
            # reload since the ads were just created
            story.ads.reload.adwords_image = company.adwords_images.default
            AdwordsController.new::create_ad(company, story, 'topic')
            AdwordsController.new::create_ad(company, story, 'retarget')
          end
        end
      else
        company.stories.published.each do |story|
          story.company.campaigns.topic.ad_group.ads.create(
            story_id: story.id, long_headline: story.title
          )
          story.company.campaigns.retarget.ad_group.ads.create(
            story_id: story.id, long_headline: story.title
          )
        end
      end
    end

  end  # sync task

  def company_seeds_lookup (company, adwords_env)
    case company.subdomain
    when 'varmour'
      {
        short_headline: 'vArmour Customer Stories',
        adwords_logo_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/7125d063-0f87-4d08-912d-ad62e281773f/varmour_1200x1200.png",
        adwords_logo_media_id: adwords_env == 'production' ? 2828012141 : 2751663760,
        default_image_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/488cc685-1be1-420f-b111-20e8e8ade5a0/varmour-existing.jpeg",
        default_image_media_id: adwords_env == 'production' ? 2828013101 : 2820465306,
      }
    when 'retailnext'
      {
        short_headline: 'RetailNext Stories',
        adwords_logo_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/aa352ac1-9063-4c6b-a4d1-fb138bcc440d/retailnext_1200x1200.png",
        adwords_logo_media_id: 2830867372,
        default_image_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/1f398239-e32f-4ae6-b3d1-224dbde4b9e6/retailnext_landscape_1.png",
        default_image_media_id: 2829811191
      }
    else
      {}
    end
  end

  ##
  ##  method creates csp ads and associated adwords image (if image doesn't already exist)
  ##  from adwords ads (topic_ads and retarget_ads)
  ##
  ##  if a story isn't published, remove the adwords ad and don't create a csp ad
  ##  if a story wasn't given a story id label, remove it
  ##
  def create_csp_ads (company, topic_ads, retarget_ads)
    equens = Story.find(7)
    company.campaigns.each() do |campaign|
      aw_ads = (campaign.type == 'TopicCampaign') ? topic_ads : retarget_ads
      aw_ads.each do |aw_ad|
        # ads are tagged willth story id
        # if no story id label, try the long headline
        story = Story.find_by(id: aw_ad[:labels].try(:[], 0).try(:[], :name)) ||
                Story.find_by(title: aw_ad[:ad][:long_headline])
        if story.present? && story.published?
          csp_ad = campaign.ad_group.ads.create(
            story_id: story.id,
            ad_id: aw_ad[:ad][:id],
            long_headline: aw_ad[:ad][:long_headline],
            status: aw_ad[:status],
            approval_status: aw_ad[:approval_status]
          )
          csp_ad.adwords_image =
            company.adwords_images.find() do |image|
              image.media_id == aw_ad[:ad][:marketing_image][:media_id]
            end ||
            company.adwords_images.create(
              media_id: aw_ad[:ad][:marketing_image][:media_id],
              image_url: aw_ad[:ad][:marketing_image][:urls]['FULL']
            )
        else
          # remove the ad if
          # - story can't be found
          # - story isn't published
          AdwordsController.new::remove_ad({ ad_id: aw_ad[:ad][:id], ad_group_id: aw_ad[:ad_group_id] })
        end
      end
    end
  end

end  # adwords namespace



