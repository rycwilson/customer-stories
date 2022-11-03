
module StoriesSeed

  def self.create
    narrative = "<p><strong>Situation</strong></p>"
    narrative << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    narrative << "<p><strong>Challenge</strong></p>"
    narrative << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    narrative << "<p><strong>Solution</strong></p>"
    narrative << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    narrative << "<p><strong>Benefits</strong></p>"
    narrative << "<p>" + FFaker::Lorem.paragraphs.join(" ") + "</p>"
    Story.create(
      title:            FFaker::Lorem.sentence,
      quote:            FFaker::Lorem.sentences.join(" "),
      quote_attr_name:  FFaker::Name.name,
      quote_attr_title: FFaker::Company.position,
      narrative:        narrative,
      video_url:        "https://www.youtube.com/embed/hecXupPpE9o"
    )
  end

end
