
class CrowdsourcingTemplate < ActiveRecord::Base

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

  before_create() { self.format_for_storage() }
  before_update() { self.format_for_storage() }

  def format_for_editor (curator)
    if curator.photo_url.present?
      self.request_body.sub!("[curator_img_url]", curator.photo_url)
    else
      self.request_body.sub!("[curator_img_url]", ActionController::Base.helpers.asset_path("user-photo-missing.png"))
    end
    # give anchor links a format that allows for editing text of the link
    # don't want to include actual links, as they'll be broken (placeholders instead of actual urls)
    self.request_body.gsub!(/<a\shref=('|\")\[(\w+)_url\]('|\")>(?!<button)(.+?)<\/a>/, '[\2_link="\4"]')
    self.request_body.gsub!(/<a\shref=('\[(\w+)_url\]')><button\stype='button'\sclass='cta'\sstyle='background-color:(#\w{6}+);border-color:#\w{6};color:#\w{6}'>(.+)&nbsp;&nbsp;&nbsp;&#9658;<\/button><\/a>/) do |match|
      "[#{$2}_button={text:\"#{$4}\",color:\"#{$3}\"}]"
    end
  end

  def format_for_storage
    # re-construct curator photo placeholder
    self.request_body.sub!( /(id=('|")curator-img('|") src=)('|")(https:\S+|\/assets\S+)('|")/,
                        '\1"[curator_img_url]"' ) # outside single quote necessary for capture reference to work correctly
    # re-construct anchor links
    self.request_body.gsub!( /\[(\w+)_link=('|")(.+?)('|")\]/, '<a href="[\1_url]">\3</a>')
    # re-construct buttons
    self.request_body.gsub!(/\[(\w+)_button={text:('|")(.+?)('|"),color:('|")(.+?)('|")}\]/) do |match|
      "<a href='[#{$1}_url]'><button type='button' class='cta' style='background-color:#{$6};border-color:#{$6};color:#{self.company.color_contrast($6) == "light" ? "#ffffff" : "#333333"}'>#{$3}&nbsp;&nbsp;&nbsp;&#9658;<\/button><\/a>"
    end
  end

  def default?
    ['Customer', 'Customer Success', 'Sales'].include?(self.name)
  end

end
