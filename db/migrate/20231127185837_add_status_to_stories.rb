class AddStatusToStories < ActiveRecord::Migration[6.1]
  def up
    add_column :stories, :status_new, :integer, default: 1, null: false

    Story.all.each do |story|
      if story.published?
        story.is_published!
      elsif story.preview_published?
        story.previewed!
      elsif story.logo_published?
        story.listed!
      else
        story.draft!
      end
    end
  end

  def down 
    remove_column :stories, :status_new
  end
end
