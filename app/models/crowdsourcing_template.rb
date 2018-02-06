class CrowdsourcingTemplate < ActiveRecord::Base

  default_scope { order(name: :asc) }

  belongs_to :company
  has_many :contributions
  has_many :templates_questions, dependent: :destroy
  has_many :contributor_questions, through: :templates_questions
  accepts_nested_attributes_for :contributor_questions, allow_destroy: true

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
    self.request_body.gsub!(/<a\shref=('\[(\w+)_url\]')><button\stype='button'\sstyle='font-size:14px;line-height:1\.42857143;cursor:pointer;padding:6px\s12px;margin:15px\s0;border-radius:4px;box-shadow:inset\s0\s1px\s0\srgba\(255,255,255,0\.15\),0\s1px\s1px\srgba\(0,0,0,0\.075\);background-color:(#\w{6}+);border-color:#\w{6};color:#\w{6}'>(.+)<\/button><\/a>/) do |match|
      "[#{$2}_button={text:\"#{$4}\",color:\"#{$3}\"}]"
    end

    # highlight all placeholders, links, and urls
    self.request_body.gsub!(/(\[.+?\])/, '<span>\1</span>')
  end

  def format_for_storage
    # re-construct curator photo placeholder
    self.request_body.sub!( /(id=('|")curator-img('|") src=)('|")(https:\S+|\/assets\S+)('|")/,
                        '\1"[curator_img_url]"' ) # outside single quote necessary for capture reference to work correctly
    # re-construct anchor links
    self.request_body.gsub!( /\[(\w+)_link=('|")(.+?)('|")\]/, '<a href="[\1_url]">\3</a>')
    # re-construct buttons
    self.request_body.gsub!(/\[(\w+)_button={text:('|")(.+?)('|"),color:('|")(.+?)('|")}\]/) do |match|
      "<a href='[#{$1}_url]'><button type='button' style='font-size:14px;line-height:1.42857143;cursor:pointer;padding:6px 12px;margin:15px 0;border-radius:4px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 1px 1px rgba(0,0,0,0.075);background-color:#{$6};border-color:#{$6};color:#{self.company.color_contrast($6) == "light" ? "#ffffff" : "#333333"}'>#{$3}<\/button><\/a>"

    end
  end

  # method adds a new contributor question associations
  def add_contributor_questions (question_params)
    if question_params.present?
      question_params.each() do |index, attrs|
        if attrs[:id] && self.contributor_questions.find_by(id: attrs[:id]).nil?
          self.contributor_questions << ContributorQuestion.find(attrs[:id])
        end
      end
    end
  end

  def default?
    ['Customer', 'Customer Success', 'Sales'].include?(self.name)
  end

end
