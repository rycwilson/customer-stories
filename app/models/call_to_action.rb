# frozen_string_literal: true

class CallToAction < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :successes, join_table: 'ctas_successes'
  has_many :stories, through: :successes

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
end
