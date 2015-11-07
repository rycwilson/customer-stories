module StoriesHelper

  # renders the story's :quote attribute as a <blockquote>
  def story_quote text
    raw "<em id='story-quote'>" + "\"#{text}\"" + "</em>"
  end

end
