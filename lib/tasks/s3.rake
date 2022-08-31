
namespace :s3 do
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
      
    uploads = S3_BUCKET.objects({ prefix: 'uploads' })

    user_image_keys = csp_keys(User, :photo_url)
    company_image_keys = csp_keys(Company, :adwords_logo_url, :logo_url)
    customer_image_keys = csp_keys(Customer, :logo_url)
    og_image_keys = csp_keys(Story, :og_image_url)
    ad_image_keys = csp_keys(AdwordsImage, :image_url)

    csp_keys = user_image_keys + company_image_keys + customer_image_keys + og_image_keys + ad_image_keys

    clean_csp(csp_keys, uploads)


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