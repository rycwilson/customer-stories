
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

    subscribers = {
      'acme-test' => Company.find_by(subdomain: 'acme-test'),
      varmour: Company.find_by(subdomain: 'varmour'),
      retailnext: Company.find_by(subdomain: 'retailnext')
    }
    subscribers.values.each() { |company| company.update(promote_tr: true) }

    # create campaigns, ad groups, images
    Company.all.each() do |company|

      if subscribers.values.include?(company)
        company_seeds = company_seeds_lookup(company, ENV['ADWORDS_ENV'])

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

        # create topic campaign / ad group
        # get topic ads
        topic_campaign = company.get_adwords_campaign('topic')
        company.campaigns.create(
          type: 'TopicCampaign', status: topic_campaign[:status],
          campaign_id: topic_campaign[:id], name: topic_campaign[:name]
        )
        topic_ad_group = company.get_adwords_ad_group(topic_campaign[:id])
        company.campaigns.topic.create_adwords_ad_group(
          ad_group_id: topic_ad_group[:id], status: topic_ad_group[:status],
          name: topic_ad_group[:name]
        )
        topic_ads = company.get_adwords_ads(topic_ad_group[:id])

        # create retarget campaign / ad group /
        # get retarget ads
        retarget_campaign = company.get_adwords_campaign('retarget')
        company.campaigns.create(
          type: 'RetargetCampaign', status: retarget_campaign[:status],
          campaign_id: retarget_campaign[:id], name: retarget_campaign[:name]
        )
        retarget_ad_group = company.get_adwords_ad_group(retarget_campaign[:id])
        company.campaigns.retarget.create_adwords_ad_group(
          ad_group_id: retarget_ad_group[:id], status: retarget_ad_group[:status],
          name: retarget_ad_group[:name]
        )
        retarget_ads = company.get_adwords_ads(retarget_ad_group[:id])

        # create topic and retarget ads
        company.create_csp_ads(topic_ads, retarget_ads)

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
    ##  - create the csp ad AND an adwords ad if it wasn't (e.g. newly published)
    ##
    Company.all.each() do |company|
      if subscribers.values.include?(company)
        company.stories.published.each() do |story|
          unless story.ads.present?
            topic_ad = story.company.campaigns.topic.ad_group.ads.create(
              story_id: story.id, long_headline: story.title
            )
            retarget_ad = story.company.campaigns.retarget.ad_group.ads.create(
              story_id: story.id, long_headline: story.title
            )
            # reload since ads are new to the loaded story object
            story.ads.reload.adwords_image = company.adwords_images.default
            puts "create adwords ad for story #{story.id} topic"
            puts "ad_group_id: #{story.company.campaigns.topic.ad_group.ad_group_id}"
            puts "image url: #{story.ads.adwords_image.image_url}"
            puts "media id: #{story.ads.adwords_image.media_id}\n"
            topic_ad.create()
            puts "create adwords ad for story #{story.id} retarget"
            puts "ad_group_id: #{story.company.campaigns.retarget.ad_group.ad_group_id}"
            puts "image url: #{story.ads.adwords_image.image_url}"
            puts "media id: #{story.ads.adwords_image.media_id}\n"
            retarget_ad.create()
          end
        end
      else
        company.stories.published.each() do |story|
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


  ##
  ##  method creates csp ads and associated adwords image (if image doesn't already exist)
  ##  from adwords ads (topic_ads and retarget_ads)
  ##
  ##  if a story isn't published, remove the adwords ad and don't create a csp ad
  ##  if a story wasn't given a story id label, remove it
  ##
  def create_csp_ads (company, topic_ads, retarget_ads)
    return false if (topic_ads.nil? || retarget_ads.nil?)  # no ads
    company.campaigns.each() do |campaign|
      aw_ads = (campaign.type == 'TopicCampaign') ? topic_ads : retarget_ads
      aw_ads.each do |aw_ad|
        # ads are tagged with story id
        # if no story id label, try the long headline
        story = Story.find_by(id: aw_ad[:labels].try(:[], 0).try(:[], :name)) ||
                Story.find_by(title: aw_ad[:ad][:long_headline])
        if story.present? && story.published?
          puts "create csp ad for ad #{aw_ad[:ad][:id]}\n"
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
          puts "removing ad from #{company.subdomain} #{campaign.type} ad group #{aw_ad[:ad_group_id]}"
          puts "because #{story.nil? ? 'story not found' : (story.published? ? 'unknown' : 'story not published') }\n"
          campaign.ad_group.ads.build({ ad_id: aw_ad[:ad][:id] }).remove()
        end
      end
    end
  end

  def company_seeds_lookup (company, adwords_env)
    case company.subdomain
    when 'acme-test'
      {
        short_headline: 'Acme Customer Stories',
        adwords_logo_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/413d1bfd-a71d-4f11-9af2-0cd886fadaba/acme_1200x1200.png",
        adwords_logo_media_id: adwords_env == 'production' ? 2836950843 : 2836731970,
        default_image_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/413d1bfd-a71d-4f11-9af2-0cd886fadaba/acme_landscape.png",
        default_image_media_id: adwords_env == 'production' ? 2834965322 : 2833629302,
      }
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
        adwords_logo_media_id: adwords_env == 'production' ? 2830867372 : 2835690126,
        default_image_url: "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/1f398239-e32f-4ae6-b3d1-224dbde4b9e6/retailnext_landscape_1.png",
        default_image_media_id: adwords_env == 'production' ? 2829811191 : 2836785967
      }
    else
      {}
    end
  end

end  # adwords namespace



