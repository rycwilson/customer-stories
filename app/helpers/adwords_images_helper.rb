module AdwordsImagesHelper
  def sort_ad_images ad, image
    [ad.images.include?(image) ? 0 : 1, image.default? ? 0 : 1]
  end
end