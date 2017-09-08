class CrowdsourcingTemplate < ActiveRecord::Base

  belongs_to :company
  has_many :contributions
  has_many :templates_questions, dependent: :destroy
  has_many :contributor_questions, through: :templates_questions
  accepts_nested_attributes_for :contributor_questions, allow_destroy: true

  default_scope { order(name: :asc) }

  # after_commit(on: :create) do
  #   self.contributor_questions << self.company.contributor_questions.default
  # end

  before_update() { |template| template.format_for_storage() }

  def format_for_editor(curator)
    if curator.photo_url.present?
      self.request_body.sub!("[curator_img_url]", curator.photo_url)
    else
      self.request_body.sub!("[curator_img_url]", ActionController::Base.helpers.asset_path("user-photo-missing.png"))
    end
    # give anchor links a format that allows for editing text of the link
    # don't want to include actual links, as they'll be broken (placeholders instead of actual urls)
    self.request_body.gsub!(/<a\shref=('|\")\[(\w+)_url\]('|\")>(.+?)<\/a>/, '[\2_link="\4"]')
    # highlight all placeholders, links, and urls
    self.request_body.gsub!(/(\[.+?\])/, '<span>\1</span>')
  end

  def format_for_storage()
    # re-construct curator photo placeholder
    self.request_body.sub!( /(id=('|")curator-img('|") src=)('|")(https:\S+|\/assets\S+)('|")/,
                        '\1"[curator_img_url]"' ) # outside single quote necessary for capture reference to work correctly
    # re-construct anchor links
    self.request_body.gsub!( /\[(\w+)_link=('|")(.+?)('|")\]/,
                         '<a href="[\1_url]">\3</a>' )
  end

  def default?
    ['Customer', 'Customer Success', 'Sales'].include?(self.name)
  end

end
