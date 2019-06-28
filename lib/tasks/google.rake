namespace :google do

  desc "Remove any stale image assets that Google has removed"
  task remove_stale_images: :environment do
    csp_asset_ids = AdwordsImage.all.map { |image| image.asset_id }.uniq
    google_asset_ids = GoogleAds::get_image_assets(csp_asset_ids).pluck(:asset_id)
    missing_images = csp_asset_ids - google_asset_ids
    AdwordsImage.where(asset_id: missing_images).destroy_all
  end

  desc "Update all ads"
  task update_all_ads: :environment do
    GoogleAds::update_ads(AdwordsAd.where.not(ad_id: nil).to_a)
  end

  desc "After copying production db to dev or staging, reset all campaigns (re-upload images first!)"
  task reset_all_campaigns: :environment do
    Company.all.each do |company|
      if company.promote_tr?
        
        # ensure these values match google (or set them to nil):
        # company.topic/retarget_campaign.campaign_id
        # company.topic/retarget_ad_group.ad_group_id
        company.sync_gads_campaigns
        
        if [company.topic_campaign, company.retarget_campaign].all? do |c|
            c.campaign_id.present? && c.ad_group.ad_group_id.present?
          end
          
          # TODO: keep existing ads, re-use assets as much as possible
          # => give ads a name: "story 123 topic" => correlate between environments
          # => api for comparing images?
          company.remove_all_gads(false)
          
          result = company.create_all_gads
          puts "***\n*** #{ company.subdomain }\n***"
          awesome_print(result)
        end
      end
    end
  end

  desc "After copying production db to dev or staging, re-upload images to google"
  task reupload_images: :environment do
    AdwordsImage.all.each do |image|
      uploaded_image = GoogleAds::upload_image_asset(image)
      image.update({
        asset_id: uploaded_image[:asset_id],
        google_url: uploaded_image[:full_size_info][:image_url]
      })
    end
  end

end