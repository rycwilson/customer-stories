class SubdomainValidator < ActiveModel::Validator
  def validate(record)
    required_pattern = /\A[a-z0-9]{1}[a-z0-9-]{1,61}[a-z0-9]{1}\z/
    excluded_patterns = /\A.+--.+|www[0-9]*|mail[0-9]*|smtp[0-9]*|ftp[0-9]*|pop[0-9]*|imap[0-9]*|ns[0-9]*\z/

    unless record.subdomain =~ required_pattern
      record.errors.add(:subdomain, :invalid_format)
    end

    if record.subdomain =~ excluded_patterns
      record.errors.add(:subdomain, :not_allowed)
    end
  end
end