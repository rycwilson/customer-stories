namespace :s3 do
  desc 'copy production uploads from csp-production-assets to csp-dev-assets or csp-prod-assets'
  # This task requires that files be downloaded to the file system.
  # =>  This seems to not be reliable on heroku. While all downloads and uploads execute without error,
  #     the s3 bucket is missing a bunch of the uploads
  # =>  But works fine in local dev environment. So for staging and production, first run this task
  #     locally (make sure to change the bucket_to variable to 'csp-prod-assets'), 
  #     then run the update_links task in the production environment
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
      puts "Downloading #{instance.class.name} #{url_field} id=#{instance.id} #{instance[url_field]}..."
      puts "\tobject key: #{object_key}"
      puts "\tlocal path: #{local_path}"
      if object_downloaded?(s3_client, bucket_from, object_key, local_path)
        puts '...download ok'
        puts 'Uploading...'
        if object_uploaded?(s3_client, bucket_to, object_key, local_path)
          puts '...upload ok'
          unless instance.update(
            url_field => bucket_to.include?('dev') ?
              "https://csp-dev-assets.s3.us-west-1.amazonaws.com/#{object_key}" :
              "https://#{ENV['CLOUDFRONT_HOST_NAME']}/#{object_key}"
          )
            puts "error updating model: #{instance.errors.full_messages}"
          end
        else  
          puts "...upload failed" 
        end
      else
        puts "...download failed" 
      end
    end
    s3_client = Aws::S3::Client.new
    # User.limit(1)
    #   .where("photo_url LIKE '%csp-production-assets%'")
    #   .each { |user| copy_object(s3_client, user, :photo_url) }
    User.all.each { |user| copy_object(s3_client, user, :photo_url) }
    # Company.limit(1)
    #   .where("logo_url LIKE '%csp-production-assets%'")
    #   .where("adwords_logo_url LIKE '%csp-production-assets%'")
    #   .each { |company| [:logo_url, :adwords_logo_url].each { |field| copy_object(s3_client, company, field) } }
    Company.all.each { |company| [:logo_url, :adwords_logo_url].each { |field| copy_object(s3_client, company, field) }}
    # Customer.limit(1)
    #   .where("logo_url LIKE '%csp-production-assets%'")
    #   .each { |customer| copy_object(s3_client, customer, :logo_url) }
    Customer.all.each { |customer| copy_object(s3_client, customer, :logo_url) }
    # AdwordsImage.limit(1)
    #   .where("image_url LIKE '%csp-production-assets%'")
    #   .each { |image| copy_object(s3_client, image, :image_url) }
    AdwordsImage.all.each { |image| copy_object(s3_client, image, :image_url) }
    # Story.limit(1)
    #   .where("og_image_url LIKE '%csp-production-assets%'")
    #   .each { |story| copy_object(s3_client, story, :og_image_url) }
    Story.all.each { |story| copy_object(s3_client, story, :og_image_url) }
  end

  desc 'update s3 upload links'
  task update_links: :environment do 
    def update_link(instance, url_field)
      key, file_name = instance[url_field]
        &.match(/csp-production-assets\.s3(?:\.|-)us-west-1\.amazonaws\.com\/uploads\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(.*)/)
        &.captures
      return false if key.nil? || file_name.nil?
      object_key = "uploads/#{key}/#{file_name}"
      unless instance.update(
        url_field => Rails.env.development? ?
          "https://csp-dev-assets.s3.us-west-1.amazonaws.com/#{object_key}" :
          "https://#{ENV['CLOUDFRONT_HOST_NAME']}/#{object_key}"
      )
        puts "error updating model: #{instance.errors.full_messages}"
      end
    end
    User.all.each { |user| update_link(user, :photo_url) }
    Company.all.each { |company| [:logo_url, :adwords_logo_url].each { |field| update_link(company, field) }}
    Customer.all.each { |customer| update_link(customer, :logo_url) }
    Story.all.each { |story| update_link(story, :og_image_url) }
    AdwordsImage.all.each { |image| update_link(image, :image_url) }
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