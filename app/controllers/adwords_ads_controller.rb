class AdwordsAdsController < ApplicationController

  def create
    story = Story.find params[:id]
    new_gads = {}
    # if missing local ad data, the gads will be created separately via AdwordsAd callback
    # if they already exist (expected), create them together
    if story.topic_ad.blank? || story.retarget_ad.blank?
      if story.topic_ad.blank?
        story.create_topic_ad(adwords_ad_group_id: story.company.topic_ad_group.id, status: 'ENABLED')
      else
        new_topic_gad = GoogleAds::create_ad(story.topic_ad)
        if new_topic_gad[:ad].present?
          story.topic_ad.update(ad_id: new_topic_gad[:ad][:id])
        else
          # error
        end
      end
      new_gads[:topic] = story.topic_ad.slice(:ad_id, :long_headline)

      if story.retarget_ad.blank?
        story.create_retarget_ad(adwords_ad_group_id: story.company.retarget_ad_group.id, status: 'ENABLED')
      else
        new_retarget_gad = GoogleAds::create_ad(story.retarget_ad)
        if new_retarget_gad[:ad].present?
          story.retarget_ad.update(ad_id: new_retarget_gad[:ad][:id])
        else
          # error
        end
      end
      new_gads[:retarget] = story.retarget_ad.slice(:ad_id, :long_headline)

    else
      add_missing_default_images(story)
      new_gads = GoogleAds::create_story_ads(story)
      if new_gads[:errors]
        new_gads[:errors] = customize_gads_errors(new_gads)
      else
        story.topic_ad.update(ad_id: new_gads[:topic][:ad_id])
        story.retarget_ad.update(ad_id: new_gads[:retarget][:ad_id])
      end
    end
    respond_to do |format|
      format.json do
        render({
          json: {
            story: { id: story.id, title: story.title.truncate(30, separator: '...') },
            newGads: new_gads,
            # topicAd: story.topic_ad.slice(:id, :status),
            # retargetAd: story.retarget_ad.slice(:id, :status)
          }
        })
      end
    end
  end

  # update the story with topic_ad_attributes and retarget_ad_attributes
  def update
    # puts 'adwords_ads#update'
    # awesome_print(story_params.to_h)
    story = Story.find(params[:id])
    if story.update(story_params)
      [story.topic_ad, story.retarget_ad].each do |ad|
        if (ad.previous_changes.keys & ['status']).any?
          if GoogleAds::change_ad_status(ad)
            # sucess
          else
            errors = ["Sorry, there was an error when changing Promoted Story status"]
          end
        else
          GoogleAds::update_ad(ad)
        end
      end
    else
      # error
    end

    # datatables updated row data (mirrors stories#promoted)
    dt_data = [
      JSON.parse(
        story.to_json({
          only: [:id, :title, :slug],
          methods: [:ads_status, :ads_long_headline, :ads_images, :csp_story_path],
          include: {
            success: {
              only: [],
              include: {
                customer: { only: [:name, :slug] }
              }
            },
            topic_ad: {
              only: [:id]
            },
            retarget_ad: {
              only: [:id]
            }
          }
        })
      )
    ]
    respond_to do |format|
      format.json do
        render({ json: { data: dt_data }.to_json })
      end

      # in most case it's sufficient to get data from a single ad (e.g. topic)),
      # since topic and retarget are supposed to be sync'ed
      format.js do
        @response_data = {}

        # presently only one attribute will change at a time
        @response_data[:previousChanges] = story.topic_ad.previous_changes.first
        @response_data[:promotedStory] = dt_data[0]
        # @response_data[:errors] = errors.present? ? errors : nil
        @response_data[:isImagesUpdate] = story_params.to_h[:topic_ad_attributes][:adwords_image_ids].present?
        # @response_date[:isStatusUpdate] = story_params.to_h[:topic_ad_attributes][:status].present?
      end
    end
  end

  private

  def story_params
    params.require(:story).permit(
      topic_ad_attributes: [ :id, :status, :long_headline, adwords_image_ids: [] ],
      retarget_ad_attributes: [ :id, :status, :long_headline, adwords_image_ids: [] ]
    )
  end

  def add_missing_default_images(story)
    default_images = story.company.adwords_images.default
    story.ads.each do |ad|
      ad.square_images << default_images.square_images unless ad.square_images.present?
      ad.landscape_images << default_images.landscape_images unless ad.landscape_images.present?
      ad.square_logos << default_images.square_logos unless ad.square_logos.present?
      ad.landscape_logos << default_images.landscape_logos unless ad.landscape_logos.present?
      ad.save
    end
  end

  def customize_gads_errors(new_gads)
    errors = []
    new_gads[:errors].each do |error|
      case error[:type]
      when 'INVALID_ID'
        errors << "Not found: #{ error[:field].underscore.humanize.downcase.singularize }"
      when 'REQUIRED'
        errors << "Required: #{ error[:field].underscore.humanize.downcase.singularize }"
      # when something else
      else
      end
    end
    errors
  end

end