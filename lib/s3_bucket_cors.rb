# Wraps Amazon S3 bucket CORS configuration.
class S3BucketCors
  attr_reader :bucket_cors

  # @param bucket_cors [Aws::S3::BucketCors] A bucket CORS object configured with an existing bucket.
  def initialize(bucket_cors=nil)
    @bucket_cors = S3_BUCKET.cors  # set in aws.rb
  end

  # Sets CORS rules on a bucket.
  #
  # @param allowed_methods [Array<String>] The types of HTTP requests to allow.
  # @param allowed_origins [Array<String>] The origins to allow.
  # @returns [Boolean] True if the CORS rules were set; otherwise, false.
  def set_cors(allowed_methods=nil, allowed_origins=nil)
    @bucket_cors.put(
      cors_configuration: {
        cors_rules: [
          {
            allowed_methods: ['GET', 'POST', 'PUT'],
            allowed_origins: company_origins,
            allowed_headers: %w[*],
            max_age_seconds: 3600
          }
        ]
      }
    )
    true
  rescue Aws::Errors::ServiceError => e
    puts "Couldn't set CORS rules for #{@bucket_cors.bucket.name}. Here's why: #{e.message}"
    false
  end

  private

  def company_origins
    subdomains = Company.all.map { |company| company.subdomain }
    if Rails.env.development?
      subdomains.map { |subdomain| "http://#{subdomain}.lvh.me:3000" }
    else
      subdomains.flat_map do |subdomain| 
        ["https://#{subdomain}.customerstories.org", "https://#{subdomain}.customerstories.net"]
      end
    end
  end
end