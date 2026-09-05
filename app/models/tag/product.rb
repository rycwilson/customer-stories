# This and other tag models are namespaced to prevent conflict with similarly named models.
class Tag::Product < ::Tag
  include Taggable
end