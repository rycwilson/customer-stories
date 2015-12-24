
module StoriesSeed

  def self.create
    Story.create(
               title:FFaker::Lorem.sentence,
               quote:FFaker::Lorem.sentences.join(" "),
          quote_attr:FFaker::Name.name << ", " << FFaker::Company.position,
           situation:FFaker::Lorem.paragraphs.join(" "),
           challenge:FFaker::Lorem.paragraphs.join(" "),
            solution:FFaker::Lorem.paragraphs.join(" "),
             results:FFaker::Lorem.paragraphs.join(" "),
           embed_url:"https://www.youtube.com/embed/hecXupPpE9o")
  end

end
