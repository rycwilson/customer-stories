namespace :s3 do
  desc 'copy production uploads from csp-production-assets to csp-dev-assets or csp-prod-assets'
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
    User.all.each { |user| copy_object(s3_client, user, :photo_url) }
    Company.all.each { |company| [:logo_url, :adwords_logo_url].each { |field| copy_object(s3_client, company, field) }}
    Customer.all.each { |customer| copy_object(s3_client, customer, :logo_url) }
    AdwordsImage.all.each { |image| copy_object(s3_client, image, :image_url) }
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
end