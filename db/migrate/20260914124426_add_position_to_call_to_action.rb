class AddPositionToCallToAction < ActiveRecord::Migration[7.2]
  def up
    add_column :call_to_actions, :position, :integer
    set_initial_positions
  end

  def down
    remove_column :call_to_actions, :position
  end

  private

  # Backfills `position` per company, 1-based. The primary call_to_action
  # (at most one per company) gets position 1; all others are ordered most
  # recently updated to least.
  def set_initial_positions
    execute <<~SQL.squish
      UPDATE call_to_actions
      SET position = ranked.position
      FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY company_id ORDER BY "primary" DESC, updated_at DESC
        ) AS position
        FROM call_to_actions
      ) AS ranked
      WHERE call_to_actions.id = ranked.id
    SQL
  end
end
