# frozen_string_literal: true

class Customer < ApplicationRecord
  include FriendlyId

  belongs_to :company
  has_many :successes, dependent: :destroy
  has_many :stories, through: :successes
  has_many :contributions, through: :successes

  # For `distinct` to work, we must either unscope from the Contribution default_scope
  # or include the necessary fields in the select clause
  # -> { select('users.*, contributions.created_at AS "contribution_created_at"').distinct }
  has_many(:contributors, -> { unscope(:order).distinct.order(:last_name) }, through: :contributions)

  validates :name, presence: true, uniqueness: { scope: :company_id }

  friendly_id :name, use: %i[slugged scoped], scope: :company_id

  after_update_commit(unless: -> { skip_callbacks }) do
    logo_was_updated = previous_changes.keys.include?('logo_url') && previous_changes[:logo_url].first.present?
    puts "logo_was_updated? #{logo_was_updated}"
    if logo_was_updated
      # S3Util.delete_object(S3_BUCKET, previous_changes[:logo_url].first)
    end
  end

  attr_accessor :skip_callbacks

  def should_generate_new_friendly_id?
    new_record? || name_changed? || slug.blank?
  end

  def name_with_stories_count
    "#{name} (#{stories.count})"
  end
end
