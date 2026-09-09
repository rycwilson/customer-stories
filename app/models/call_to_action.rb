# frozen_string_literal: true

class CallToAction < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :successes, join_table: 'ctas_successes'
  has_and_belongs_to_many :tags
  # has_many :stories, through: :successes

  before_save :demote_current_primary, if: -> { primary? && will_save_change_to_primary? }

  accepts_nested_attributes_for(
    :company,
    reject_if: ->(company_attrs) { !color_attributes_only?(company_attrs) },
    allow_destroy: false
  )

  validates :display_text, :company, presence: true
  validates :link_url, presence: true, if: -> { type == 'CtaLink' }

  scope :primary, -> { where(primary: true) }
  scope :sidebar, -> { where(primary: false) } # where.not(id: primary)
  scope :links, -> { where(type: 'CtaLink') }
  scope :forms, -> { where(type: 'CtaForm') }

  # Primary CTA colors are defined on the company.
  # Any update should include only the company id and primary_cta_* attributes.
  def self.color_attributes_only?(attrs)
    attrs.keys.all? { |attr| attr =~ /(\Aid\z)|primary_cta/ }
  end

  private_class_method :color_attributes_only?

  private 

  def demote_current_primary
    self.class.where(company_id:).where.not(id:).update_all(primary: false)
  end
end
