
namespace :google do

  desc "After copying production db to dev or staging, re-upload images to google"
  task re_upload_images: :environment do
    AdwordsImage.all.each do |image|
      uploaded_image = GoogleAds::upload_image_asset(image)
      image.update({
        asset_id: uploaded_image[:asset_id],
        google_url: uploaded_image[:full_size_info][:image_url]
      })
    end
  end

  desc "Remove any stale image assets that Google has removed"
  task remove_stale_images: :environment do
    csp_asset_ids = AdwordsImage.all.map { |image| image.asset_id }
    awesome_print(csp_asset_ids)
    google_asset_ids = GoogleAds::get_image_assets(csp_asset_ids).pluck(:asset_id)
    awesome_print(google_asset_ids)
    missing_images = csp_asset_ids.uniq - google_asset_ids
    AdwordsImage.where(asset_id: missing_images).destroy_all
  end

end