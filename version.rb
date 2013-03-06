module Chorus
  module VERSION #:nodoc:
    MAJOR         = 2
    MINOR         = 2
    SERVICE_PACK  = 1 
    PATCH         = 1
    STRING = [MAJOR, MINOR, SERVICE_PACK, PATCH, ENV['BUILD_NUMBER']].compact.join('.')
  end
end
