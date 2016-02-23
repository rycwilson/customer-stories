class RenameBenefitsInStories < ActiveRecord::Migration

  def change
    rename_column :stories, :results, :benefits
  end

end
