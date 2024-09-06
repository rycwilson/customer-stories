class InvitationTemplate < ApplicationRecord
  default_scope { order(name: :asc) }

  belongs_to :company
  has_many :contributions
  has_many :templates_questions, dependent: :destroy
  has_many :contributor_questions, through: :templates_questions
  alias_attribute :questions, :contributor_questions
  accepts_nested_attributes_for(
    :templates_questions,
    # reject_if: Proc.new { |tq| tq['contributor_question_id'].blank? },
    allow_destroy: true
  )
  accepts_nested_attributes_for(
    :contributor_questions,
    # reject_if: Proc.new { |tq| tq['contributor_question_id'].present? },
    allow_destroy: false
  )

  # after_commit(on: :create) do
  #   self.contributor_questions << self.company.contributor_questions.default
  # end

  scope :default, -> { where("name IN ('Customer', 'Customer Success', 'Sales')") }
  scope :custom, -> { where("name NOT IN ('Customer', 'Customer Success', 'Sales')") }

  validates_uniqueness_of(:name, scope: :company_id)

  before_create(unless: Proc.new { |template| template.request_body.blank? }) do
    self.format_for_storage()
  end
  before_update() { self.format_for_storage() }

  def button_style_settings
    'display: inline-block;' +
    'font-size: 1.1em;' +
    'line-height: 1.1em;' +
    'letter-spacing: 0.02rem;' +
    'font-weight: 600;' +
    'text-decoration: none;' +
    'margin: 12px 0;' +
    'padding: 12px 20px;' +
    'border-radius: 4px;' +
    'cursor: pointer'
  end

  def format_for_editor(curator)
    if curator.photo_url.present?
      request_body.sub!("[curator_img_url]", curator.photo_url)
    else
      request_body.sub!("[curator_img_url]", ActionController::Base.helpers.asset_path("placeholders/user-photo-missing.png"))
    end
    # give anchor links a format that allows for editing text of the link
    # don't want to include actual links, as they'll be broken (placeholders instead of actual urls)
    # binding.remote_pry
    request_body.gsub!(/<a\shref=('|\")\[(\w+)_url\]('|\")\starget=('|\")_blank('|\")>(.+?)<\/a>/, '[\2_link="\4"]')
    request_body.gsub!(/<a\shref=('\[(\w+)_url\]')\starget='_blank'\sclass='csp-cta'\sstyle='background-color:(#\w{6}+);border-color:#\w{6};color:#\w{6};#{Regexp.quote(button_style_settings)}'>(.+)<\/a>/) do |match|
      "[#{$2}_button={text:\"#{$4}\",color:\"#{$3}\"}]"
    end
    self
  end

  def format_for_storage
    # re-construct curator photo placeholder
    # outside single quote necessary for capture reference to work correctly
    request_body.sub!( /(id=('|")curator-img('|") src=)('|")(https:\S+|\/assets\S+)('|")/, '\1"[curator_img_url]"' )
    # re-construct anchor links
    request_body.gsub!( /\[(\w+)_link=('|")(.+?)('|")\]/, '<a href="[\1_url]" target="_blank">\3</a>')
    # re-construct buttons
    request_body.gsub!(/\[(\w+)_button={text:('|")(.+?)('|"),color:('|")(.+?)('|")}\]/) do |match|
      "<a href='[#{$1}_url]' target='_blank' class='csp-cta' style='background-color:#{$6};border-color:#{$6};color:#{InvitationTemplate.color_shade($6) == 'light' ? "#333333" : "ffffff"};#{button_style_settings}'>#{$3.truncate(25)}<\/a>"
    end
    request_body.sub!(/^<p>/, '<p style="margin-top:0">')
  end

  def default?
    ['Customer', 'Customer Success', 'Sales'].include?(self.name)
  end

  def self.color_shade(hex_color)
    ApplicationController.helpers.color_shade(hex_color)
  end

  def path
    Rails.application.routes.url_helpers.company_invitation_template_path(self.company, self)
  end

end
