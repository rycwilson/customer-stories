# frozen_string_literal: true

class CallToAction < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :successes, join_table: 'ctas_successes'
  has_and_belongs_to_many :tags

  before_save :demote_current_primary, if: -> { primary? && will_save_change_to_primary? }
  before_create :update_position

  validates :display_text, :company, presence: true
  validates :link_url, presence: true, if: -> { type == 'CtaLink' }

  default_scope { order(position: :asc) }
  scope :primary, -> { where(primary: true) }
  scope :sidebar, -> { where(primary: false) } # where.not(id: primary)
  scope :links, -> { where(type: 'CtaLink') }
  scope :forms, -> { where(type: 'CtaForm') }

  private

  def demote_current_primary
    company.ctas.where.not(id:).update_all(primary: false)
    company.ctas.reset
  end

  def update_position
    self.position = 1
    company.ctas.where.not(id:).update_all("position = position + 1")
    company.ctas.reset  
  end
end
