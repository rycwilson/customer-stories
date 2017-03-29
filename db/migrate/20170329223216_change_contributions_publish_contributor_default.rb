class ChangeContributionsPublishContributorDefault < ActiveRecord::Migration

  def up
    change_column_default :contributions, :publish_contributor, true
  end

  def down
    change_column_default :contributions, :publish_contributor, false
  end

end
