class EmailTemplate < ActiveRecord::Base

  belongs_to :company
  has_many :contributions
  validates :subject, presence: true
  validates :body, presence: true

  before_update do |template|
    template.format_for_storage
  end

  def format_for_editor curator
    if curator.photo_url.present?
      self.body.sub! "[curator_img_url]", curator.photo_url
    else
      self.body.sub! "[curator_img_url]", ActionController::Base.helpers.asset_path("user-photo-missing.png")
    end
    # give anchor links a format that allows for editing text of the link
    # don't want to include actual links, as they'll be broken (placeholders instead of actual urls)
    self.body.gsub!(/<a\shref=('|\")\[(\w+)\]('|\")>(.+?)<\/a>/, '[\2 link_text="\4"]')
    # highlight all placeholders, links, and urls
    self.body.gsub!(/(\[.+?\])/, '<span>\1</span>')
  end

  def format_for_storage
    # re-construct curator photo placeholder
    self.body.sub!( /(id=('|")curator-img('|") src=)('|")(https:\S+|\/assets\S+)('|")/,
                        '\1"[curator_img_url]"' ) # outside single quote necessary for capture reference to work correctly
    # re-construct anchor links
    self.body.gsub!( /\[(\w+)\slink_text=('|")(.+?)('|")\]/,
                         '<a href="[\1]">\3</a>' )
    # remove highlights
    # self.body.gsub!( /<span\sstyle=\"color:.+?\">(.+?)<\/span>/, '\1' )
  end

end