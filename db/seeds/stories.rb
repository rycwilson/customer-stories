
module StoriesSeed

  def self.create
    content = "<p><strong>Situation</strong></p>"
    content << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    content << "<p><strong>Challenge</strong></p>"
    content << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    content << "<p><strong>Solution</strong></p>"
    content << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    content << "<p><strong>Benefits</strong></p>"
    content << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    Story.create(
             title:FFaker::Lorem.sentence,
             quote:FFaker::Lorem.sentences.join(" "),
        quote_attr:FFaker::Name.name << ", " << FFaker::Company.position,
           content: content,
         embed_url:"https://www.youtube.com/embed/hecXupPpE9o")
  end

end
