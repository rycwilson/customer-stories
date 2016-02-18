class EmailTemplate < ActiveRecord::Base

  belongs_to :company

  before_update do |template|
    # re-construct curator photo placeholder
    template.body.sub!( /(id=('|")curator-img('|") src=)('|")https:\/\/\S+('|")/,
                        '\1"[curator_img_url]"' ) # outside single quote necessary for capture reference to work correctly
    # re-construct anchor links
    template.body.gsub!( /\[(\w+)\slink_text=('|")(.+?)('|")\]/,
                         '<a href="[\1]">\3</a>' )
    # remove highlights
    template.body.gsub!( /<span\sstyle=\"color:.+?\">(.+?)<\/span>/, '\1' )
  end

end