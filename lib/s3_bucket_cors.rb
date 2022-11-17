# Wraps Amazon S3 bucket CORS configuration.
class S3BucketCors
  attr_reader :bucket_cors

  SUBDOMAINS = %w(csp acme-test pixlee varmour retailnext trunity compas centerforcustomerengagement corefact juniper saucelabs)
  DEV_ORIGINS = SUBDOMAINS.map { |subdomain| "http://#{subdomain}.lvh.me:3000" }
  PROD_ORIGINS = SUBDOMAINS.map { |subdomain| "https://#{subdomain}.customerstories.net" }

  # @param bucket_cors [Aws::S3::BucketCors] A bucket CORS object configured with an existing bucket.
  def initialize(bucket_cors=nil)
    # @bucket_cors = bucket_cors
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
            allowed_origins: Rails.env.development? ? DEV_ORIGINS : PROD_ORIGINS,
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

end