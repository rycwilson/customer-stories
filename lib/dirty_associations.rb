module DirtyAssociations

  attr_accessor :dirty_associations?

  def dirty_associations
    self.dirty_associations? = true
  end

  def changed?
    dirty_associations? || super
  end

end

# class Blog
#   include DirtyAssociations

#   has_many :posts, {
#     after_add: :dirty_associations,
#     after_remove: :dirty_associations,
#   }
# end