# Not sure why this was originally added, but it needs to be false (set in new_framework_defaults.rb),
# since, e.g., a User model can exist without a company_id
# Rails.application.config.active_record.belongs_to_required_by_default = true