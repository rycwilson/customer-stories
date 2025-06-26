class CreateJoinTableStoryCallToAction < ActiveRecord::Migration[7.2]
  def change
    create_join_table :stories, :call_to_actions do |t|
      t.index [:story_id, :call_to_action_id]
    end

    CtasSuccess.all.each do |join_entry|
      story = Success.find(join_entry.success_id)&.story
      next unless story

      # NOTE: Using CallToActionsStories model does not work here because there is no model (unlike CtasSuccess)
      ActiveRecord::Base.connection.execute(
        "INSERT INTO call_to_actions_stories (story_id, call_to_action_id) VALUES (#{story.id}, #{join_entry.call_to_action_id})"
      )
    end
  end
end
