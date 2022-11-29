namespace :s3 do

  desc 'copy production uploads'
  task copy_bucket: :environment do
    require 'fileutils'
    def object_downloaded?(s3_client, bucket_name, object_key, local_path)
      s3_client.get_object(
        response_target: local_path,
        bucket: bucket_name,
        key: object_key
      )
    rescue StandardError => e
      puts "Error getting object: #{e.message}"
    end
    def object_uploaded?(s3_client, bucket_name, object_key, local_path)
      File.open(local_path.to_s, 'rb') do |file|
        response = s3_client.put_object({ body: file, bucket: bucket_name, key: object_key })
        return response.etag.present?
      end
    rescue StandardError => e
      puts "Error uploading object: #{e.message}"
      return false
    end
    def copy_object(s3_client, instance, url_field)
      bucket_from = 'csp-production-assets'
      bucket_to = ENV['S3_BUCKET']
      key, file_name = instance[url_field]
        &.match(/csp-production-assets\.s3(?:\.|-)us-west-1\.amazonaws\.com\/uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(.*)/)
        &.captures
      return false if key.nil? || file_name.nil?
      object_key = "uploads/#{key}/#{file_name}"
      FileUtils.mkdir_p Rails.root.join('tmp', 'uploads', "#{key}")
      local_path = Rails.root.join('tmp', 'uploads', "#{key}", "#{file_name}")
      if object_downloaded?(s3_client, bucket_from, object_key, local_path)
        if object_uploaded?(s3_client, bucket_to, object_key, local_path)
          instance.update(
            url_field => bucket_to.include?('dev') ?
              "https://csp-dev-assets.s3.us-west-1.amazonaws.com/#{object_key}" :
              "https://#{ENV['CLOUDFRONT_HOST_NAME']}/#{object_key}"
          )
        end
      end
    end
    s3_client = Aws::S3::Client.new(region: 'us-west-1')
    User.all.each { |user| copy_object(s3_client, user, :photo_url) }
    Company.all.each { |company| [:logo_url, :adwords_logo_url].each { |field| copy_object(s3_client, company, field) }}
    Customer.all.each { |customer| copy_object(s3_client, customer, :logo_url) }
    Story.all.each { |story| copy_object(s3_client, story, :og_image_url) }
    AdwordsImage.all.each { |image| copy_object(s3_client, image, :image_url) }
  end

  desc "clean uploads"
  task clean: :environment do
    # PRODUCTION IMAGES (csp-production-assets) when running in dev environment  
    # => ok to clean local db
    # if running task in dev, treat csp-production-assets as missing from s3 and nillify/delete
    # if running in production, will only be production assets so no need to check

    def update_local_orhphans(orphans)
    end
    
    def csp_keys(uploadable, *image_attrs) 
      uploadable.all.flat_map do |instance|
        image_attrs
          .map do |image_attr| 
            # key = instance[attr]&.match(/uploads\/(?<key>([a-f]|[0-9]|-)+)\//).try(:[], :key)
            instance[image_attr].match(/(?<key>uploads\/.+\z)/).try(:[], :key) 
          end
          .compact
      end
    end
    
    def clean_csp(uploadable, key, uploads)
      local_orphans = {
        users: [],
        companies: [],
        customers: [],
        stories: [],
        adwords_images: [],
      }
      uploadable.each do |uploadable|

      end
      
      unless key
        table = uploadable.table_name.to_sym
        if has_orphaned_key = local_orphans[table].find { |inst| inst[:id] == instance.id }
          inst[:attributes] << image_attr
        else
          local_orphans[table] << { id: instance.id, attributes: [image_attr] }
        end
      end
    end
      
    # uploads = S3_BUCKET.objects({ prefix: 'uploads' })

    # user_image_keys = csp_keys(User, :photo_url)
    # company_image_keys = csp_keys(Company, :adwords_logo_url, :logo_url)
    # customer_image_keys = csp_keys(Customer, :logo_url)
    # og_image_keys = csp_keys(Story, :og_image_url)
    # ad_image_keys = csp_keys(AdwordsImage, :image_url)

    # csp_keys = user_image_keys + company_image_keys + customer_image_keys + og_image_keys + ad_image_keys

    # clean_csp(csp_keys, uploads)


    # clean_local(
    #   user_image_keys + company_image_keys + customer_image_keys + og_image_keys + ad_image_keys,
    #   uploads
    # )


    # persisted_keys = AdwordsImage.all.map do |image|
      # look up a particular object via image_url
      # if not there
      
    # end.compact
  end
end